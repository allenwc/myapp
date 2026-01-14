import { request } from '@umijs/max';
import { getSupabaseClient } from '@/services/supabase/client';
import type { CurrentUser, GeographicItemType } from './data';

export async function queryCurrent(): Promise<{ data: CurrentUser }> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('tb_user_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        return {
          data: {
            userid: user.id,
            name: data.name || '',
            avatar: data.avatar || '',
            email: data.email || user.email || '',
            signature: data.signature || '',
            title: data.title || '',
            group: data.group || '',
            tags: data.tags || [],
            notifyCount: data.notify_count || 0,
            unreadCount: data.unread_count || 0,
            country: data.country || '',
            geographic: data.geographic || {
              province: { label: '', key: '' },
              city: { label: '', key: '' },
            },
            address: data.address || '',
            phone: data.phone || '',
            notice: [],
          } as CurrentUser,
        };
      }
    }
  }

  // Return empty structure for new users instead of fallback to mock
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      return {
        data: {
          userid: user.id,
          name: '',
          avatar: '',
          email: user.email || '',
          signature: '',
          title: '',
          group: '',
          tags: [],
          notifyCount: 0,
          unreadCount: 0,
          country: '',
          geographic: {
            province: { label: '', key: '' },
            city: { label: '', key: '' },
          },
          address: '',
          phone: '',
          notice: [],
        } as CurrentUser,
      };
    }
  }

  return request('/api/accountSettingCurrentUser');
}

export async function updateCurrent(params: Partial<CurrentUser>) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    // Fallback to mock/api if no supabase
    return request('/api/accountSettingCurrentUser', {
      method: 'POST',
      data: params,
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const dbPayload: any = {
    name: params.name,
    avatar: params.avatar,
    email: params.email,
    signature: params.signature,
    title: params.title,
    group: params.group,
    tags: params.tags,
    notify_count: params.notifyCount,
    unread_count: params.unreadCount,
    country: params.country,
    geographic: params.geographic,
    address: params.address,
    phone: params.phone,
    user_id: user.id,
  };

  // Remove undefined keys
  Object.keys(dbPayload).forEach((key) => {
    if (dbPayload[key] === undefined) delete dbPayload[key];
  });

  console.log('updateCurrent dbPayload:', dbPayload);

  // Check if user info exists
  const { data: existing, error: queryError } = await supabase
    .from('tb_user_info')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (queryError && queryError.code !== 'PGRST116') {
    // PGRST116 is "The result contains 0 rows"
    console.error('Check existing user error:', queryError);
  }

  if (existing) {
    console.log('Updating existing user info:', existing);
    const { error } = await supabase
      .from('tb_user_info')
      .update(dbPayload)
      .eq('user_id', user.id);
    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
  } else {
    console.log('Inserting new user info');
    const { error } = await supabase.from('tb_user_info').insert([dbPayload]);
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
  }

  return { data: params };
}

export async function queryProvince(): Promise<{ data: GeographicItemType[] }> {
  return request('/api/geographic/province');
}

export async function queryCity(
  province: string,
): Promise<{ data: GeographicItemType[] }> {
  return request(`/api/geographic/city/${province}`);
}

export async function query() {
  return request('/api/users');
}
