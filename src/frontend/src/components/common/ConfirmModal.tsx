import { Modal } from 'antd';
import { uiText } from '@/constants/uiText';

type ConfirmModalProps = {
  title?: string;
  description?: string;
  open: boolean;
  confirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmModal = ({
  title = uiText.common.confirmModal.title,
  description = uiText.common.confirmModal.description,
  open,
  confirmLoading,
  onConfirm,
  onCancel
}: ConfirmModalProps) => {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={confirmLoading}
      okText={uiText.common.confirmModal.confirm}
      cancelText={uiText.common.confirmModal.cancel}
      okButtonProps={{ danger: true }}
    >
      {description}
    </Modal>
  );
};
