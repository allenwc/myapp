import {
  type ActionType,
  PageContainer,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  createTrack,
  deleteTrack,
  fetchAllFamilyMembers,
  fetchFamilyTracks,
  updateTrack,
} from '../service';
import type { FamilyMember, Track } from '../types';

const Tracks: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  useEffect(() => {
    fetchAllFamilyMembers().then(setMembers);
  }, []);

  const columns: ProColumns<Track>[] = [
    {
      title: '家庭成员',
      dataIndex: 'memberId',
      valueType: 'select',
      width: 120,
      fieldProps: {
        options: members.map((m) => ({ label: m.name, value: m.id })),
      },
      formItemProps: {
        rules: [{ required: true, message: '请选择家庭成员' }],
      },
      render: (_, record) => record.person,
    },
    {
      title: '出发城市',
      dataIndex: 'from',
      formItemProps: {
        rules: [{ required: true, message: '请输入出发城市' }],
      },
    },
    {
      title: '到达城市',
      dataIndex: 'to',
      formItemProps: {
        rules: [{ required: true, message: '请输入到达城市' }],
      },
    },
    {
      title: '开始日期',
      dataIndex: 'startDate',
      valueType: 'date',
      width: 120,
      formItemProps: {
        rules: [{ required: true, message: '请选择开始日期' }],
      },
    },
    {
      title: '结束日期',
      dataIndex: 'endDate',
      valueType: 'date',
      width: 120,
      formItemProps: {
        rules: [{ required: true, message: '请选择结束日期' }],
      },
    },
    {
      title: '原因',
      dataIndex: 'reason',
      valueType: 'textarea',
      ellipsis: true,
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
              await deleteTrack(record.id);
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
    <PageContainer title="轨迹维护">
      <ProTable<Track>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async () => {
          const data = await fetchFamilyTracks();
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
                await createTrack(row);
              } else {
                await updateTrack(row);
              }
              message.success('保存成功');
              actionRef.current?.reload();
            } catch (error) {
              message.error('保存失败');
              throw error;
            }
          },
          onDelete: async (key, row) => {
            await deleteTrack(row.id);
            message.success('删除成功');
          },
        }}
        columnsState={{
          persistenceKey: 'pro-table-family-tracks',
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
        headerTitle="轨迹列表"
        toolBarRender={() => [
          <Button
            key="button"
            type="primary"
            onClick={() => {
              actionRef.current?.addEditRecord?.({
                id: 'new',
                memberId: members[0]?.id || '',
                person: '',
                from: '',
                to: '',
                startDate: '',
                endDate: '',
                reason: '',
              });
            }}
          >
            新建轨迹
          </Button>,
        ]}
      />
    </PageContainer>
  );
};

export default Tracks;
