import { renderHook, act } from '@testing-library/react';
import { useNotifications, useToast } from '../hooks/useNotifications';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: jest.fn().mockImplementation(() => ({})),
  writable: true
});

describe('useNotifications', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  test('adds notification', () => {
    const { result } = renderHook(() => useNotifications());

    act(() => {
      result.current.addNotification({
        title: 'Test Notification',
        message: 'This is a test'
      });
    });

    expect(result.current.notifications).toHaveLength(1);
    expect(result.current.notifications[0].title).toBe('Test Notification');
    expect(result.current.unreadCount).toBe(1);
  });

  test('marks notification as read', () => {
    const { result } = renderHook(() => useNotifications());

    let notificationId;
    act(() => {
      notificationId = result.current.addNotification({
        title: 'Test Notification',
        message: 'This is a test'
      });
    });

    act(() => {
      result.current.markAsRead(notificationId);
    });

    expect(result.current.notifications[0].read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  test('removes notification', () => {
    const { result } = renderHook(() => useNotifications());

    let notificationId;
    act(() => {
      notificationId = result.current.addNotification({
        title: 'Test Notification',
        message: 'This is a test'
      });
    });

    act(() => {
      result.current.removeNotification(notificationId);
    });

    expect(result.current.notifications).toHaveLength(0);
  });
});

describe('useToast', () => {
  test('shows success toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Success message');
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].message).toBe('Success message');
  });

  test('auto-removes toast after duration', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showSuccess('Success message', { duration: 1000 });
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.toasts).toHaveLength(0);

    jest.useRealTimers();
  });
});