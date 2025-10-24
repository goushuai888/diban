import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(request, response) {
  // 设置 CORS 头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    const { method } = request;

    switch (method) {
      case 'GET':
        return await getListings(request, response);
      case 'POST':
        return await createListing(request, response);
      default:
        return response.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Listings API error:', error);
    return response.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// 获取交易列表
async function getListings(request, response) {
  const {
    page = 1,
    limit = 20,
    status = 'active',
    type = 'sell',
    min_price,
    max_price
  } = request.query;

  try {
    let query = supabase
      .from('listings')
      .select(`
        *,
        seller:profiles(username, avatar_url, rating, total_trades),
        bids(*)
      `)
      .eq('status', status)
      .eq('type', type)
      .order('created_at', { ascending: false });

    // 价格范围过滤
    if (min_price) {
      query = query.gte('price', parseFloat(min_price));
    }
    if (max_price) {
      query = query.lte('price', parseFloat(max_price));
    }

    // 分页
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return response.status(200).json({
      listings: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get listings error:', error);
    return response.status(500).json({ error: 'Failed to fetch listings' });
  }
}

// 创建新交易
async function createListing(request, response) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return response.status(401).json({ error: 'Invalid token' });
    }

    const {
      type,           // 'sell' | 'rent' | 'transfer'
      title,
      description,
      price,
      duration_days,  // 仅租赁类型需要
      tesla_account,
      location,
      contact_method,
      terms
    } = request.body;

    // 验证必填字段
    if (!type || !title || !description || !price || !tesla_account || !location || !contact_method) {
      return response.status(400).json({
        error: 'Missing required fields',
        required_fields: ['type', 'title', 'description', 'price', 'tesla_account', 'location', 'contact_method']
      });
    }

    // 验证交易类型
    if (!['sell', 'rent', 'transfer'].includes(type)) {
      return response.status(400).json({ error: 'Invalid listing type' });
    }

    // 租赁类型需要时长
    if (type === 'rent' && !duration_days) {
      return response.status(400).json({ error: 'Duration is required for rental listings' });
    }

    const listingData = {
      seller_id: user.id,
      type,
      title,
      description,
      price: parseFloat(price),
      duration_days: type === 'rent' ? parseInt(duration_days) : null,
      tesla_account,
      location,
      contact_method,
      terms,
      status: 'active',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select()
      .single();

    if (error) throw error;

    return response.status(201).json({
      message: 'Listing created successfully',
      listing: data
    });
  } catch (error) {
    console.error('Create listing error:', error);
    return response.status(500).json({ error: 'Failed to create listing' });
  }
}