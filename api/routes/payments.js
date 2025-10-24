import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(request, response) {
  // 设置 CORS 头
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  try {
    const { method } = request;

    switch (method) {
      case 'POST':
        return await createPayment(request, response);
      case 'GET':
        return await getPaymentHistory(request, response);
      case 'PUT':
        return await updatePaymentStatus(request, response);
      default:
        return response.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payments API error:', error);
    return response.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// 创建支付订单
async function createPayment(request, response) {
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
      listing_id,
      payment_method,  // 'alipay' | 'wechat' | 'bank_transfer'
      amount,
      message
    } = request.body;

    // 验证必填字段
    if (!listing_id || !payment_method || !amount) {
      return response.status(400).json({
        error: 'Missing required fields',
        required_fields: ['listing_id', 'payment_method', 'amount']
      });
    }

    // 验证支付方式
    if (!['alipay', 'wechat', 'bank_transfer'].includes(payment_method)) {
      return response.status(400).json({ error: 'Invalid payment method' });
    }

    // 获取交易信息
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select(`
        *,
        seller:profiles(username, email)
      `)
      .eq('id', listing_id)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      return response.status(404).json({ error: 'Listing not found or not active' });
    }

    // 检查是否是自己的交易
    if (listing.seller_id === user.id) {
      return response.status(400).json({ error: 'Cannot purchase your own listing' });
    }

    // 验证金额
    if (parseFloat(amount) !== listing.price) {
      return response.status(400).json({ error: 'Invalid payment amount' });
    }

    // 生成唯一订单号
    const order_no = `FSD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 创建支付记录
    const paymentData = {
      order_no,
      listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      amount: parseFloat(amount),
      payment_method,
      status: 'pending',  // pending -> paid -> completed -> refunded
      message: message || '',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30分钟后过期
    };

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) throw paymentError;

    // 创建支付方式相关信息
    let payment_info = {};

    switch (payment_method) {
      case 'alipay':
        payment_info = {
          qr_code: `https://qr.alipay.com/baxXXXXX`, // 实际项目中需要调用支付宝API
          account_name: 'FSD平台收款账户',
          amount: amount
        };
        break;
      case 'wechat':
        payment_info = {
          qr_code: `weixin://wxpay/bizpayurl?pr=XXXXX`, // 实际项目中需要调用微信支付API
          account_name: 'FSD平台收款账户',
          amount: amount
        };
        break;
      case 'bank_transfer':
        payment_info = {
          bank_name: '中国银行',
          account_name: 'FSD平台收款账户',
          account_number: '6217 **** **** 1234',
          amount: amount,
          reference: order_no
        };
        break;
    }

    return response.status(201).json({
      message: 'Payment order created successfully',
      payment: {
        ...payment,
        payment_info
      }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return response.status(500).json({ error: 'Failed to create payment' });
  }
}

// 获取支付历史
async function getPaymentHistory(request, response) {
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
      page = 1,
      limit = 20,
      status,
      type  // 'buyer' | 'seller'
    } = request.query;

    let query = supabase
      .from('payments')
      .select(`
        *,
        listing:listing_info(title, type, price),
        buyer:buyer_info(username),
        seller:seller_info(username)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    // 状态过滤
    if (status) {
      query = query.eq('status', status);
    }

    // 类型过滤
    if (type === 'buyer') {
      query = query.eq('buyer_id', user.id);
    } else if (type === 'seller') {
      query = query.eq('seller_id', user.id);
    }

    // 分页
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return response.status(200).json({
      payments: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    return response.status(500).json({ error: 'Failed to fetch payment history' });
  }
}

// 更新支付状态（管理员或系统调用）
async function updatePaymentStatus(request, response) {
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

    // 检查是否是管理员（实际项目中需要更完善的权限控制）
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return response.status(403).json({ error: 'Insufficient permissions' });
    }

    const {
      payment_id,
      status,  // 'paid' | 'completed' | 'refunded' | 'cancelled'
      notes
    } = request.body;

    if (!payment_id || !status) {
      return response.status(400).json({
        error: 'Missing required fields',
        required_fields: ['payment_id', 'status']
      });
    }

    // 验证状态值
    if (!['pending', 'paid', 'completed', 'refunded', 'cancelled'].includes(status)) {
      return response.status(400).json({ error: 'Invalid status' });
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .update({
        status,
        updated_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq('id', payment_id)
      .select()
      .single();

    if (error) throw error;

    if (!payment) {
      return response.status(404).json({ error: 'Payment not found' });
    }

    // 如果支付完成，更新交易状态
    if (status === 'completed') {
      await supabase
        .from('listings')
        .update({ status: 'sold' })
        .eq('id', payment.listing_id);
    }

    return response.status(200).json({
      message: 'Payment status updated successfully',
      payment
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    return response.status(500).json({ error: 'Failed to update payment status' });
  }
}