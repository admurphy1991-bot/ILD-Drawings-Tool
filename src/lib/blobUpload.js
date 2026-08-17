import { upload } from '@vercel/blob/client'

export async function uploadToBlob(fileOrBlob, filename) {
  const blob = await upload(filename, fileOrBlob, {
    access: 'public',
    handleUploadUrl: '/api/upload',
    multipart: true,
  })
  return blob.url
}
