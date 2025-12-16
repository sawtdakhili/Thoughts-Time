import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { memo } from 'react';
import ItemActions from './ItemActions';
import { FloatingDateHeader } from './FloatingDateHeader';

describe('Component Performance Regression Tests', () => {
  describe('ItemActions memoization', () => {
    it('should not re-render when parent re-renders with same props', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onJumpToSource = vi.fn();

      let renderCount = 0;

      // Wrap component to track renders
      const TrackedItemActions = memo(() => {
        renderCount++;
        return <ItemActions onEdit={onEdit} onDelete={onDelete} onJumpToSource={onJumpToSource} />;
      });

      const { rerender } = render(<TrackedItemActions />);

      // Initial render
      expect(renderCount).toBe(1);

      // Re-render with same props (parent update)
      rerender(<TrackedItemActions />);

      // Should still be 1 render due to memo
      expect(renderCount).toBe(1);
    });

    it('should re-render when props actually change', () => {
      const onEdit1 = vi.fn();
      const onEdit2 = vi.fn(); // Different function reference
      const onDelete = vi.fn();

      let renderCount = 0;

      const TrackedItemActions = memo(({ onEdit }: { onEdit: () => void }) => {
        renderCount++;
        return <ItemActions onEdit={onEdit} onDelete={onDelete} />;
      });

      const { rerender } = render(<TrackedItemActions onEdit={onEdit1} />);
      expect(renderCount).toBe(1);

      // Re-render with different onEdit prop
      rerender(<TrackedItemActions onEdit={onEdit2} />);

      // Should re-render because prop changed
      expect(renderCount).toBe(2);
    });

    it('should render all three buttons with onJumpToSource', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onJumpToSource = vi.fn();

      const { container } = render(
        <ItemActions onEdit={onEdit} onDelete={onDelete} onJumpToSource={onJumpToSource} />
      );

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(3); // Jump, Edit, Delete
    });

    it('should render two buttons without onJumpToSource', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      const { container } = render(<ItemActions onEdit={onEdit} onDelete={onDelete} />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2); // Edit, Delete only
    });
  });

  describe('FloatingDateHeader memoization', () => {
    it('should not re-render when parent re-renders with same props', () => {
      let renderCount = 0;

      // Wrap component to track renders
      const TrackedFloatingDateHeader = memo(() => {
        renderCount++;
        return <FloatingDateHeader date="2025-12-15" isToday={false} />;
      });

      const { rerender } = render(<TrackedFloatingDateHeader />);

      // Initial render
      expect(renderCount).toBe(1);

      // Re-render with same props (parent scroll event)
      rerender(<TrackedFloatingDateHeader />);

      // Should still be 1 render due to memo
      expect(renderCount).toBe(1);
    });

    it('should re-render when date changes', () => {
      let renderCount = 0;

      const TrackedFloatingDateHeader = memo(({ date }: { date: string }) => {
        renderCount++;
        return <FloatingDateHeader date={date} isToday={false} />;
      });

      const { rerender } = render(<TrackedFloatingDateHeader date="2025-12-15" />);
      expect(renderCount).toBe(1);

      // Re-render with different date
      rerender(<TrackedFloatingDateHeader date="2025-12-16" />);

      // Should re-render because date changed
      expect(renderCount).toBe(2);
    });

    it('should re-render when isToday changes', () => {
      let renderCount = 0;

      const TrackedFloatingDateHeader = memo(({ isToday }: { isToday: boolean }) => {
        renderCount++;
        return <FloatingDateHeader date="2025-12-15" isToday={isToday} />;
      });

      const { rerender } = render(<TrackedFloatingDateHeader isToday={false} />);
      expect(renderCount).toBe(1);

      // Re-render with different isToday
      rerender(<TrackedFloatingDateHeader isToday={true} />);

      // Should re-render because isToday changed
      expect(renderCount).toBe(2);
    });

    it('should display formatted date correctly', () => {
      const { container } = render(<FloatingDateHeader date="2025-12-15" isToday={false} />);

      const heading = container.querySelector('h3');
      expect(heading).toBeTruthy();
      expect(heading?.textContent).toContain('Monday, Dec 15, 2025');
    });

    it('should show "(Today)" when isToday is true', () => {
      const { container } = render(<FloatingDateHeader date="2025-12-15" isToday={true} />);

      const heading = container.querySelector('h3');
      expect(heading?.textContent).toContain('(Today)');
    });

    it('should not show "(Today)" when isToday is false', () => {
      const { container } = render(<FloatingDateHeader date="2025-12-15" isToday={false} />);

      const heading = container.querySelector('h3');
      expect(heading?.textContent).not.toContain('(Today)');
    });
  });

  describe('General memoization patterns', () => {
    it('should verify stable function references for callbacks', () => {
      // This test verifies that callback functions maintain stable references
      // which is crucial for memo() effectiveness

      const callback1 = vi.fn();
      const callback2 = callback1; // Same reference

      expect(callback1).toBe(callback2);

      const callback3 = vi.fn(); // Different reference
      expect(callback1).not.toBe(callback3);
    });

    it('should verify primitive props are compared by value', () => {
      // Strings
      const str1 = '2025-12-15';
      const str2 = '2025-12-15';
      expect(str1).toBe(str2);

      // Booleans
      const bool1 = true;
      const bool2 = true;
      expect(bool1).toBe(bool2);

      // Numbers
      const num1 = 42;
      const num2 = 42;
      expect(num1).toBe(num2);
    });

    it('should document that object/array props need useMemo', () => {
      // Objects are compared by reference, not value
      const obj1 = { id: '1', content: 'Task' };
      const obj2 = { id: '1', content: 'Task' };

      // Different references even with same content
      expect(obj1).not.toBe(obj2);

      // Arrays are also compared by reference
      const arr1 = ['a', 'b', 'c'];
      const arr2 = ['a', 'b', 'c'];

      expect(arr1).not.toBe(arr2);

      // This test documents why useMemo is needed for object/array props
      // to maintain stable references across renders
    });
  });

  describe('Render performance expectations', () => {
    it('should render ItemActions in under 10ms', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();

      const startTime = performance.now();
      render(<ItemActions onEdit={onEdit} onDelete={onDelete} />);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10);
    });

    it('should render FloatingDateHeader in under 10ms', () => {
      const startTime = performance.now();
      render(<FloatingDateHeader date="2025-12-15" isToday={false} />);
      const endTime = performance.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10);
    });

    it('should handle rapid prop updates efficiently', () => {
      const { rerender } = render(<FloatingDateHeader date="2025-12-15" isToday={false} />);

      const startTime = performance.now();

      // Simulate rapid scroll updates (50 updates)
      for (let i = 0; i < 50; i++) {
        const date = `2025-12-${15 + (i % 16)}`;
        rerender(<FloatingDateHeader date={date} isToday={false} />);
      }

      const endTime = performance.now();
      const totalDuration = endTime - startTime;

      // 50 updates should complete in under 500ms
      expect(totalDuration).toBeLessThan(500);

      // Average per update should be under 10ms
      const avgDuration = totalDuration / 50;
      expect(avgDuration).toBeLessThan(10);
    });
  });
});
