import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import React, { useRef } from 'react';
import {
  createFamilyMember,
  deleteFamilyMember,
  fetchAllFamilyMembers,
  updateFamilyMember,
} from '../service';
import type { FamilyMember } from '../types';

const Members: React.FC = () => {
  const actionRef = useRef<ActionType>(null);

  const columns: ProColumns<FamilyMember>[] = [
    {
      title: '姓名',
      dataIndex: 'name',
      formItemProps: {
        rules: [{ required: true, message: '请输入姓名' }],
      },
    },
    {
      title: 'Emoji',
      dataIndex: 'emoji',
      valueType: 'text',
      width: 80,
      formItemProps: {
        rules: [{ required: true, message: '请输入Emoji' }],
      },
    },
    {
      title: '代表色',
      dataIndex: 'color',
      valueType: 'color',
      width: 100,
      formItemProps: {
        rules: [{ required: true, message: '请选择颜色' }],
      },
    },
    {
      title: '常住地',
      dataIndex: 'residenceCity',
    },
    {
      title: '出生日期',
      dataIndex: 'birthDate',
      valueType: 'date',
    },
    {
      title: '离世日期',
      dataIndex: 'deathDate',
      valueType: 'date',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      valueType: 'digit',
      initialValue: 0,
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      valueType: 'switch',
      initialValue: true,
      width: 80,
      render: (_, record) => (record.isActive ? '启用' : '禁用'),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (text, record, _, action) => [
        <a
          key="editable"
          onClick={() => {
            action?.startEditable?.(record.id);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除吗？"
          onConfirm={async () => {
            try {
              await deleteFamilyMember(record.id);
              message.success('删除成功');
              actionRef.current?.reload();
            } catch (error) {
              message.error('删除失败');
            }
          }}
        >
          <a style={{ color: 'red' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer title="家庭成员维护">
      <ProTable<FamilyMember>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async () => {
          const data = await fetchAllFamilyMembers();
          return {
            data,
            success: true,
          };
        }}
        editable={{
          type: 'multiple',
          onSave: async (key, row) => {
            try {
              if (row.id === 'new') {
                await createFamilyMember(row);
              } else {
                await updateFamilyMember(row);
              }
              message.success('保存成功');
              actionRef.current?.reload();
            } catch (error) {
              message.error('保存失败');
              throw error;
            }
          },
          onDelete: async (key, row) => {
            // Delete is handled by Popconfirm, but if using built-in delete:
            await deleteFamilyMember(row.id);
            message.success('删除成功');
          },
        }}
        columnsState={{
          persistenceKey: 'pro-table-family-members',
          persistenceType: 'localStorage',
        }}
        rowKey="id"
        search={false}
        options={{
          setting: {
            listsHeight: 400,
          },
        }}
        pagination={{
          pageSize: 20,
        }}
        dateFormatter="string"
        headerTitle="家庭成员列表"
        toolBarRender={() => [
          <Button
            key="button"
            type="primary"
            onClick={() => {
              actionRef.current?.addEditRecord?.({
                id: 'new',
                name: '',
                color: '#1890ff',
                emoji: '👤',
                sort: 0,
                isActive: true,
              });
            }}
          >
            新建成员
          </Button>,
        ]}
      />
    </PageContainer>
  );
};

export default Members;
