import axiosInstance from './axios';

/**
 * notificationApi
 * All notification-related API calls.
 */
const notificationApi = {

  /**
   * Get all notifications for current user.
   * GET /notifications
   * Returns: NotificationResponse[]
   */
  getAll: async () => {
    const response = await axiosInstance.get('/notifications');
    return response.data;
  },

  /**
   * Get only unread notifications.
   * GET /notifications/unread
   * Returns: NotificationResponse[]
   */
  getUnread: async () => {
    const response = await axiosInstance.get('/notifications/unread');
    return response.data;
  },

  /**
   * Mark a notification as read.
   * PATCH /notifications/{notification_id}/read
   * Returns: NotificationResponse
   */
  markRead: async (notificationId) => {
    const response = await axiosInstance.patch(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },
};

export default notificationApi;