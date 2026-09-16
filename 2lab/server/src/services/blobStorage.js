import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';

let blobServiceClient = null;
let containerClient = null;

export async function initBlobStorage(maxRetries = 10, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Storage] Connecting to Azure Blob Storage (attempt ${attempt}/${maxRetries})...`);
      blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
      containerClient = blobServiceClient.getContainerClient(config.azure.containerName);

      await containerClient.createIfNotExists({
        access: 'blob'
      });

      console.log(`[Storage] Container "${config.azure.containerName}" is ready.`);
      return;
    } catch (err) {
      console.error(`[Storage] Azure connection failed: ${err.message}`);
      if (attempt === maxRetries) {
        console.warn('[Storage] Warning: Failed to connect to Azure Blob Storage. Will retry during operations.');
        return;
      }
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
}

export async function uploadCoverBlob(file) {
  if (!containerClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
    containerClient = blobServiceClient.getContainerClient(config.azure.containerName);
  }

  const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
  const blobName = `${uuidv4()}-${sanitizedOriginalName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: {
      blobContentType: file.mimetype,
      blobCacheControl: 'public, max-age=31536000'
    }
  });

  return blobName;
}

export async function deleteCoverBlob(blobName) {
  if (!blobName) return false;
  if (!containerClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
    containerClient = blobServiceClient.getContainerClient(config.azure.containerName);
  }

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const response = await blockBlobClient.deleteIfExists();
    return response.succeeded;
  } catch (err) {
    console.error(`[Storage] Failed to delete blob "${blobName}":`, err.message);
    return false;
  }
}

export function getCoverUrl(blobName, req) {
  if (!blobName) return null;
  
  if (config.azure.publicBlobUrl) {
    return `${config.azure.publicBlobUrl.replace(/\/$/, '')}/${config.azure.containerName}/${blobName}`;
  }

  if (req) {
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || `localhost:${config.port}`;
    return `${protocol}://${host}/api/books/cover/${blobName}`;
  }

  return `/api/books/cover/${blobName}`;
}

export async function downloadCoverBlobStream(blobName) {
  if (!containerClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.azure.connectionString);
    containerClient = blobServiceClient.getContainerClient(config.azure.containerName);
  }

  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const downloadResponse = await blockBlobClient.download(0);

  return {
    stream: downloadResponse.readableStreamBody,
    contentType: downloadResponse.contentType || 'image/jpeg',
    contentLength: downloadResponse.contentLength
  };
}
