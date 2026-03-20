import { Button, Col, Form, Input, Modal, Row, Select, Space, Table, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@components/common/PageHeader';
import { SectionCard } from '@components/common/SectionCard';
import { StatusPill } from '@components/common/StatusPill';
import {
  useApproveWalletTopupRequest,
  useGetAdminWalletTopupRequests,
  useRejectWalletTopupRequest
} from '@hooks/usePayments';
import { WalletTopupRequestStatus } from '@/types/enums';
import { WalletTopupRequestDto } from '@/types/payment.types';
import { formatCurrency, formatDateTime } from '@utils/format';

const { Text } = Typography;

const topupStatusTone: Record<WalletTopupRequestStatus, 'success' | 'warning' | 'danger'> = {
  [WalletTopupRequestStatus.PENDING]: 'warning',
  [WalletTopupRequestStatus.APPROVED]: 'success',
  [WalletTopupRequestStatus.REJECTED]: 'danger'
};

const topupStatusLabel: Record<WalletTopupRequestStatus, string> = {
  [WalletTopupRequestStatus.PENDING]: 'Chờ duyệt',
  [WalletTopupRequestStatus.APPROVED]: 'Đã duyệt',
  [WalletTopupRequestStatus.REJECTED]: 'Đã từ chối'
};

type RejectFormValues = {
  rejectionReason: string;
};

export const AdminPaymentReconcilePage = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<WalletTopupRequestStatus | undefined>(WalletTopupRequestStatus.PENDING);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectRequest, setSelectedRejectRequest] = useState<WalletTopupRequestDto | null>(null);
  const [rejectForm] = Form.useForm<RejectFormValues>();

  const topupRequestsQuery = useGetAdminWalletTopupRequests(filterStatus, true);
  const approveMutation = useApproveWalletTopupRequest();
  const rejectMutation = useRejectWalletTopupRequest();

  const requests = topupRequestsQuery.data || [];

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === WalletTopupRequestStatus.PENDING).length,
    [requests]
  );

  const handleOpenRejectModal = (request: WalletTopupRequestDto) => {
    setSelectedRejectRequest(request);
    setRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false);
    setSelectedRejectRequest(null);
    rejectForm.resetFields();
  };

  const handleRejectRequest = async (values: RejectFormValues) => {
    if (!selectedRejectRequest) {
      return;
    }

    await rejectMutation.mutateAsync({
      id: selectedRejectRequest.id,
      payload: {
        rejectionReason: values.rejectionReason.trim()
      }
    });

    handleCloseRejectModal();
  };

  return (
    <>
      <PageHeader
        eyebrow="Admin wallet ops"
        title="Duyệt yêu cầu nạp ví"
        subtitle="Inbox yêu cầu nạp ví từ user. Admin duyệt hoặc từ chối thủ công sau khi đối chiếu chuyển khoản."
        onBack={() => navigate('/dashboard')}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <SectionCard title="Bộ lọc yêu cầu nạp ví" subtitle="Theo dõi nhanh trạng thái inbox nạp tiền">
            <Space wrap size={[12, 12]}>
              <Select<WalletTopupRequestStatus | undefined>
                allowClear
                placeholder="Lọc theo trạng thái"
                value={filterStatus}
                onChange={(value) => setFilterStatus(value)}
                style={{ minWidth: 220 }}
                options={[
                  { label: 'Chờ duyệt', value: WalletTopupRequestStatus.PENDING },
                  { label: 'Đã duyệt', value: WalletTopupRequestStatus.APPROVED },
                  { label: 'Đã từ chối', value: WalletTopupRequestStatus.REJECTED }
                ]}
              />
              <Button onClick={() => topupRequestsQuery.refetch()} loading={topupRequestsQuery.isFetching}>
                Refresh
              </Button>
              <Text type="secondary">{`Tổng yêu cầu hiển thị: ${requests.length}`}</Text>
              <Text type="secondary">{`Pending trong danh sách: ${pendingCount}`}</Text>
            </Space>
          </SectionCard>
        </Col>

        <Col xs={24}>
          <SectionCard title="Inbox yêu cầu nạp ví" subtitle="Duyệt đúng số tiền request hoặc từ chối kèm lý do">
            <Table<WalletTopupRequestDto>
              rowKey="id"
              loading={topupRequestsQuery.isFetching}
              dataSource={requests}
              pagination={{ pageSize: 10, showSizeChanger: true }}
              columns={[
                {
                  title: 'Request',
                  key: 'request',
                  render: (_, record) => (
                    <Space direction="vertical" size={4}>
                      <Text strong>{`#${record.id}`}</Text>
                      <Text type="secondary">{`User #${record.userId}`}</Text>
                      <StatusPill label={topupStatusLabel[record.status]} tone={topupStatusTone[record.status]} subtle />
                    </Space>
                  )
                },
                {
                  title: 'Số tiền',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (value: number, record) => <Text strong>{formatCurrency(value, record.currency)}</Text>
                },
                {
                  title: 'Mã giao dịch',
                  dataIndex: 'providerTxnId',
                  key: 'providerTxnId',
                  render: (value: string) => (
                    <Text style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>{value}</Text>
                  )
                },
                {
                  title: 'Nội dung CK',
                  dataIndex: 'transferContent',
                  key: 'transferContent',
                  render: (value: string) => <Text>{value}</Text>
                },
                {
                  title: 'Review',
                  key: 'review',
                  render: (_, record) => (
                    <Space direction="vertical" size={4}>
                      <Text type="secondary">{`Tạo lúc: ${formatDateTime(record.createdAt)}`}</Text>
                      <Text type="secondary">{`Review lúc: ${formatDateTime(record.reviewedAt)}`}</Text>
                      {record.rejectionReason ? <Text type="danger">{`Lý do từ chối: ${record.rejectionReason}`}</Text> : null}
                    </Space>
                  )
                },
                {
                  title: 'Thao tác',
                  key: 'actions',
                  render: (_, record) => (
                    <Space wrap>
                      <Button
                        type="primary"
                        disabled={record.status !== WalletTopupRequestStatus.PENDING}
                        loading={approveMutation.isPending}
                        onClick={async () => {
                          await approveMutation.mutateAsync(record.id);
                        }}
                      >
                        Duyệt
                      </Button>
                      <Button
                        danger
                        disabled={record.status !== WalletTopupRequestStatus.PENDING}
                        loading={rejectMutation.isPending}
                        onClick={() => handleOpenRejectModal(record)}
                      >
                        Từ chối
                      </Button>
                    </Space>
                  )
                }
              ]}
            />
          </SectionCard>
        </Col>
      </Row>

      <Modal
        title={selectedRejectRequest ? `Từ chối request #${selectedRejectRequest.id}` : 'Từ chối yêu cầu'}
        open={rejectModalOpen}
        onCancel={handleCloseRejectModal}
        onOk={() => rejectForm.submit()}
        okText="Xác nhận từ chối"
        cancelText="Đóng"
        confirmLoading={rejectMutation.isPending}
      >
        <Form<RejectFormValues> layout="vertical" form={rejectForm} onFinish={handleRejectRequest}>
          <Form.Item
            label="Lý do từ chối"
            name="rejectionReason"
            rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
          >
            <Input.TextArea rows={4} maxLength={500} placeholder="VD: Nội dung chuyển khoản không khớp" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
