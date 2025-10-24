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
        return await handleAuth(request, response);
      case 'GET':
        return await getProfile(request, response);
      default:
        return response.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    return response.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

// 处理用户认证（登录/注册）
async function handleAuth(request, response) {
  try {
    const { action, email, password, username } = request.body;

    if (!action || !email || !password) {
      return response.status(400).json({
        error: 'Missing required fields',
        required_fields: ['action', 'email', 'password']
      });
    }

    switch (action) {
      case 'signup':
        return await signUp(request, response, { email, password, username });
      case 'signin':
        return await signIn(request, response, { email, password });
      case 'signout':
        return await signOut(request, response);
      default:
        return response.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Auth handle error:', error);
    return response.status(500).json({ error: 'Authentication failed' });
  }
}

// 用户注册
async function signUp(request, response, { email, password, username }) {
  try {
    // 验证用户名
    if (!username || username.length < 3) {
      return response.status(400).json({ error: 'Username must be at least 3 characters long' });
    }

    // 检查用户名是否已存在
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (existingUser) {
      return response.status(400).json({ error: 'Username already exists' });
    }

    // 注册用户
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    });

    if (error) throw error;

    if (data.user && !data.session) {
      // 用户注册成功，但需要邮箱验证
      return response.status(200).json({
        message: 'Registration successful. Please check your email to verify your account.',
        user: data.user,
        needs_verification: true
      });
    }

    if (data.user && data.session) {
      // 创建用户配置文件
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          username,
          email,
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // 不阻断注册流程，只记录错误
      }

      return response.status(201).json({
        message: 'Registration successful',
        user: data.user,
        session: data.session,
        needs_verification: false
      });
    }

    return response.status(400).json({ error: 'Registration failed' });
  } catch (error) {
    console.error('Sign up error:', error);
    return response.status(500).json({ error: 'Registration failed' });
  }
}

// 用户登录
async function signIn(request, response, { email, password }) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return response.status(401).json({ error: 'Invalid email or password' });
      }
      throw error;
    }

    if (data.user && data.session) {
      // 获取用户配置文件
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }

      return response.status(200).json({
        message: 'Login successful',
        user: data.user,
        session: data.session,
        profile: profile || {
          id: data.user.id,
          username: data.user.user_metadata?.username || 'User',
          email: data.user.email
        }
      });
    }

    return response.status(400).json({ error: 'Login failed' });
  } catch (error) {
    console.error('Sign in error:', error);
    return response.status(500).json({ error: 'Login failed' });
  }
}

// 用户登出
async function signOut(request, response) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const { error } = await supabase.auth.signOut(token);

    if (error) throw error;

    return response.status(200).json({ message: 'Sign out successful' });
  } catch (error) {
    console.error('Sign out error:', error);
    return response.status(500).json({ error: 'Sign out failed' });
  }
}

// 获取用户信息
async function getProfile(request, response) {
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

    // 获取用户详细信息
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        *,
        listings_seller(count),
        reviews_received(rating, comment, created_at, reviewer:profiles(username))
      `)
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw profileError;
    }

    // 计算用户统计数据
    const stats = {
      total_listings: profile?.listings_seller?.[0]?.count || 0,
      total_reviews: profile?.reviews_received?.length || 0,
      average_rating: profile?.reviews_received?.length > 0
        ? profile.reviews_received.reduce((sum, review) => sum + review.rating, 0) / profile.reviews_received.length
        : 0
    };

    return response.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.username || profile?.username || 'User'
      },
      profile: profile || {
        id: user.id,
        username: user.user_metadata?.username || 'User',
        email: user.email
      },
      stats
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return response.status(500).json({ error: 'Failed to fetch profile' });
  }
}