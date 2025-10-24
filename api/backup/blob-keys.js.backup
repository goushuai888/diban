import { list } from '@vercel/blob';

export default async function handler(request, response) {
  // 只允许 GET 请求
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    
    if (!token) {
      return response.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN not configured' });
    }

    // 查找 key.txt 文件
    const { blobs } = await list({
      token,
      prefix: 'key.txt'
    });

    const keyFile = blobs.find(blob => blob.pathname === 'key.txt');
    
    if (!keyFile) {
      return response.status(404).json({ error: 'Key file not found' });
    }

    // 获取文件内容
    const fileResponse = await fetch(keyFile.url);
    
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file: ${fileResponse.status}`);
    }
    
    const text = await fileResponse.text();
    const lines = text.split('\n').filter(line => line.trim());

    const keys = lines.map((line, index) => ({
      key: line.trim(),
      name: `密钥 ${index + 1}`,
      isSystem: true,
      group: '默认组'
    }));

    // 设置 CORS 头
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    return response.status(200).json({ keys });

  } catch (error) {
    console.error('Blob API error:', error);
    return response.status(500).json({ 
      error: 'Failed to fetch keys from blob storage',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
