import { toast as hotToast } from 'react-hot-toast';

const toast = {
  success: (message: string) => {
    hotToast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },
  error: (message: string) => {
    hotToast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },
  loading: (message: string) => {
    return hotToast.loading(message, {
      position: 'top-right',
      style: {
        padding: '16px',
        borderRadius: '8px',
      },
    });
  },
};

export default toast;
