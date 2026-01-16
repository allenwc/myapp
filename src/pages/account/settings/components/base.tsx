import { ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormDependency,
  ProFormFieldSet,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { useModel, useRequest } from '@umijs/max';
import { Button, Input, message, Upload } from 'antd';
import React, { useState } from 'react';
import { getSupabaseClient } from '@/services/supabase/client';
import {
  queryCity,
  queryCurrent,
  queryProvince,
  updateCurrent,
} from '../service';
import useStyles from './index.style';

const validatorPhone = (
  _rule: any,
  value: string[],
  callback: (message?: string) => void,
) => {
  if (!value[0]) {
    callback('Please input your area code!');
  }
  if (!value[1]) {
    callback('Please input your phone number!');
  }
  callback();
};

const BaseView: React.FC = () => {
  const { styles } = useStyles();
  const { initialState, setInitialState } = useModel('@@initialState');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // 头像组件
  const AvatarView = ({ avatar }: { avatar: string }) => {
    const [uploadLoading, setUploadLoading] = useState(false);

    // Randomly generate a Robohash avatar
    const handleRandomAvatar = () => {
      const randomString = Math.random().toString(36).substring(7);
      const randomSet = `set${Math.floor(Math.random() * 4) + 1}`;
      const url = `https://robohash.org/${randomString}.png?set=${randomSet}`;
      setAvatarUrl(url);
    };

    const handleUpload = async (options: any) => {
      const { file, onSuccess, onError } = options;
      setUploadLoading(true);
      try {
        const supabase = getSupabaseClient();
        if (!supabase) throw new Error('Supabase client not initialized');

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        setAvatarUrl(data.publicUrl);
        onSuccess(data.publicUrl);
        message.success('图片上传成功');
      } catch (error: any) {
        console.error('Upload error:', error);
        message.error('图片上传失败: ' + error.message);
        onError(error);
      } finally {
        setUploadLoading(false);
      }
    };

    return (
      <>
        <div className={styles.avatar_title}>头像</div>
        <div className={styles.avatar}>
          <img src={avatar} alt="avatar" />
        </div>
        <div
          className={styles.button_view}
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
        >
          <Button onClick={handleRandomAvatar} style={{ width: '100%' }}>
            <ReloadOutlined />
            更换头像
          </Button>
          <Upload
            customRequest={handleUpload}
            showUploadList={false}
            accept="image/*"
            style={{ width: '100%' }}
          >
            <Button
              loading={uploadLoading}
              icon={<UploadOutlined />}
              style={{ width: '100%' }}
            >
              上传头像
            </Button>
          </Upload>
        </div>
      </>
    );
  };

  const { data: currentUser, loading } = useRequest(() => {
    return queryCurrent();
  });

  const getAvatarURL = () => {
    if (avatarUrl) return avatarUrl;
    if (currentUser) {
      if (currentUser.avatar) {
        return currentUser.avatar;
      }
      const url =
        'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png';
      return url;
    }
    return '';
  };
  const handleFinish = async (values: any) => {
    try {
      // Transform phone array to string
      let phone = values.phone;
      if (Array.isArray(phone)) {
        phone = phone.join('-');
      }

      // Transform geographic
      const geographic = {
        province: {
          label: values.province?.label,
          key: values.province?.value,
        },
        city: {
          label: values.city?.label,
          key: values.city?.value,
        },
      };

      const payload = {
        ...values,
        phone,
        geographic,
        avatar: avatarUrl || undefined, // Include avatarUrl if changed
      };
      console.log('BaseView handleFinish payload:', payload);
      await updateCurrent(payload);

      // Update global state
      if (initialState?.currentUser && payload.avatar) {
        const newUserInfo = {
          ...initialState.currentUser,
          name: payload.name,
          avatar: payload.avatar,
        };
        setInitialState({
          ...initialState,
          currentUser: newUserInfo,
        });
      }

      message.success('更新基本信息成功');
    } catch (error: any) {
      console.error('Update failed:', error);
      message.error(`更新失败: ${error.message || '未知错误'}`);
    }
  };
  return (
    <div className={styles.baseView}>
      {loading ? null : (
        <>
          <div className={styles.left}>
            <ProForm
              layout="vertical"
              onFinish={handleFinish}
              submitter={{
                searchConfig: {
                  submitText: '更新基本信息',
                },
                render: (_, dom) => dom[1],
              }}
              initialValues={{
                ...currentUser,
                phone: currentUser?.phone?.split('-'),
                province: currentUser?.geographic?.province
                  ? {
                      label: currentUser.geographic.province.label,
                      value: currentUser.geographic.province.key,
                    }
                  : undefined,
                city: currentUser?.geographic?.city
                  ? {
                      label: currentUser.geographic.city.label,
                      value: currentUser.geographic.city.key,
                    }
                  : undefined,
              }}
              hideRequiredMark
            >
              <ProFormText
                width="md"
                name="email"
                label="邮箱"
                rules={[
                  {
                    required: true,
                    message: '请输入您的邮箱!',
                  },
                ]}
              />
              <ProFormText
                width="md"
                name="name"
                label="昵称"
                rules={[
                  {
                    required: true,
                    message: '请输入您的昵称!',
                  },
                ]}
              />
              <ProFormTextArea
                name="signature"
                label="个人简介"
                rules={[
                  {
                    required: true,
                    message: '请输入个人简介!',
                  },
                ]}
                placeholder="个人简介"
              />
              <ProFormSelect
                width="sm"
                name="country"
                label="国家/地区"
                rules={[
                  {
                    required: true,
                    message: '请输入您的国家或地区!',
                  },
                ]}
                options={[
                  {
                    label: '中国',
                    value: 'China',
                  },
                ]}
              />

              <ProForm.Group title="所在省市" size={8}>
                <ProFormSelect
                  rules={[
                    {
                      required: true,
                      message: '请输入您的所在省!',
                    },
                  ]}
                  width="sm"
                  fieldProps={{
                    labelInValue: true,
                  }}
                  name="province"
                  request={async () => {
                    return queryProvince().then(({ data }) => {
                      return data.map((item) => {
                        return {
                          label: item.name,
                          value: item.id,
                        };
                      });
                    });
                  }}
                />
                <ProFormDependency name={['province']}>
                  {({ province }) => {
                    return (
                      <ProFormSelect
                        params={{
                          key: province?.value,
                        }}
                        name="city"
                        width="sm"
                        fieldProps={{
                          labelInValue: true,
                        }}
                        rules={[
                          {
                            required: true,
                            message: '请输入您的所在城市!',
                          },
                        ]}
                        disabled={!province}
                        request={async () => {
                          if (!province?.key && !province?.value) {
                            return [];
                          }
                          return queryCity(
                            province.key || province.value || '',
                          ).then(({ data }) => {
                            return data.map((item) => {
                              return {
                                label: item.name,
                                value: item.id,
                              };
                            });
                          });
                        }}
                      />
                    );
                  }}
                </ProFormDependency>
              </ProForm.Group>
              <ProFormText
                width="md"
                name="address"
                label="街道地址"
                rules={[
                  {
                    required: true,
                    message: '请输入您的街道地址!',
                  },
                ]}
              />
              <ProFormFieldSet
                name="phone"
                label="联系电话"
                rules={[
                  {
                    required: true,
                    message: '请输入您的联系电话!',
                  },
                  {
                    validator: validatorPhone,
                  },
                ]}
              >
                <Input className={styles.area_code} />
                <Input className={styles.phone_number} />
              </ProFormFieldSet>
            </ProForm>
          </div>
          <div className={styles.right}>
            <AvatarView avatar={getAvatarURL()} />
          </div>
        </>
      )}
    </div>
  );
};
export default BaseView;
