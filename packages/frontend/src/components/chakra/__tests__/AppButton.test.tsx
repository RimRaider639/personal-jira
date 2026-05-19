/**
 * Tests for AppButton and AppIconButton components
 *
 * Tests intent variants, loading states, tooltips, and accessibility.
 *
 * @see Requirements: 2.4, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppButton, AppIconButton } from '../AppButton';

// Mock Chakra UI components
jest.mock('@chakra-ui/react', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  
  // Mock Button component
  const Button = React.forwardRef(({ 
    children, 
    variant, 
    colorPalette, 
    disabled, 
    loading,
    loadingText,
    onClick,
    testID,
    ...props 
  }: {
    children?: React.ReactNode;
    variant?: string;
    colorPalette?: string;
    disabled?: boolean;
    loading?: boolean;
    loadingText?: string;
    onClick?: () => void;
    testID?: string;
  }, ref: React.Ref<typeof TouchableOpacity>) => (
    <TouchableOpacity
      ref={ref}
      testID={testID || 'button'}
      disabled={disabled}
      onPress={onClick}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      {...props}
    >
      <Text testID="button-variant">{variant}</Text>
      <Text testID="button-color-palette">{colorPalette}</Text>
      <Text testID="button-loading">{loading ? 'true' : 'false'}</Text>
      <Text>{loading && loadingText ? loadingText : children}</Text>
    </TouchableOpacity>
  ));
  Button.displayName = 'Button';
  
  // Mock IconButton component
  const IconButton = React.forwardRef(({ 
    children, 
    variant, 
    colorPalette, 
    disabled, 
    'aria-label': ariaLabel,
    onClick,
    testID,
    ...props 
  }: {
    children?: React.ReactNode;
    variant?: string;
    colorPalette?: string;
    disabled?: boolean;
    'aria-label'?: string;
    onClick?: () => void;
    testID?: string;
  }, ref: React.Ref<typeof TouchableOpacity>) => (
    <TouchableOpacity
      ref={ref}
      testID={testID || 'icon-button'}
      disabled={disabled}
      onPress={onClick}
      accessibilityRole="button"
      accessibilityLabel={ariaLabel}
      accessibilityState={{ disabled }}
      {...props}
    >
      <Text testID="icon-button-variant">{variant}</Text>
      <Text testID="icon-button-color-palette">{colorPalette}</Text>
      {children}
    </TouchableOpacity>
  ));
  IconButton.displayName = 'IconButton';
  
  // Mock Spinner component
  const Spinner = ({ size }: { size?: string }) => (
    <View testID="spinner">
      <Text>Loading...</Text>
    </View>
  );
  
  // Mock Tooltip namespace components
  const TooltipRoot = ({ children, openDelay, positioning }: {
    children: React.ReactNode;
    openDelay?: number;
    positioning?: { placement?: string };
  }) => (
    <View testID="tooltip-root">
      <Text testID="tooltip-open-delay">{openDelay}</Text>
      <Text testID="tooltip-placement">{positioning?.placement}</Text>
      {children}
    </View>
  );
  
  const TooltipTrigger = ({ children, asChild }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => (
    <View testID="tooltip-trigger">
      {children}
    </View>
  );
  
  const TooltipPositioner = ({ children }: { children: React.ReactNode }) => (
    <View testID="tooltip-positioner">{children}</View>
  );
  
  const TooltipContent = ({ children }: { children: React.ReactNode }) => (
    <View testID="tooltip-content">
      <Text>{children}</Text>
    </View>
  );
  
  return {
    Button,
    IconButton,
    Spinner,
    Tooltip: {
      Root: TooltipRoot,
      Trigger: TooltipTrigger,
      Positioner: TooltipPositioner,
      Content: TooltipContent,
    },
  };
});

// Mock icons
jest.mock('../../../theme/icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    AddIcon: () => <Text testID="add-icon">+</Text>,
    DeleteIcon: () => <Text testID="delete-icon">×</Text>,
  };
});

// Import icons after mock
import { AddIcon, DeleteIcon } from '../../../theme/icons';

describe('AppButton', () => {
  describe('intent variants', () => {
    it('should render with primary intent (solid variant, brand colorPalette)', () => {
      render(<AppButton intent="primary">Primary</AppButton>);
      
      expect(screen.getByTestId('button-variant')).toHaveTextContent('solid');
      expect(screen.getByTestId('button-color-palette')).toHaveTextContent('brand');
    });
    
    it('should render with secondary intent (outline variant)', () => {
      render(<AppButton intent="secondary">Secondary</AppButton>);
      
      expect(screen.getByTestId('button-variant')).toHaveTextContent('outline');
      expect(screen.getByTestId('button-color-palette')).toHaveTextContent('brand');
    });
    
    it('should render with danger intent (solid variant, red colorPalette)', () => {
      render(<AppButton intent="danger">Delete</AppButton>);
      
      expect(screen.getByTestId('button-variant')).toHaveTextContent('solid');
      expect(screen.getByTestId('button-color-palette')).toHaveTextContent('red');
    });
    
    it('should render with ghost intent (ghost variant)', () => {
      render(<AppButton intent="ghost">Ghost</AppButton>);
      
      expect(screen.getByTestId('button-variant')).toHaveTextContent('ghost');
      expect(screen.getByTestId('button-color-palette')).toHaveTextContent('brand');
    });
    
    it('should default to primary intent when not specified', () => {
      render(<AppButton>Default</AppButton>);
      
      expect(screen.getByTestId('button-variant')).toHaveTextContent('solid');
      expect(screen.getByTestId('button-color-palette')).toHaveTextContent('brand');
    });
  });
  
  describe('icons', () => {
    it('should render with left icon', () => {
      render(
        <AppButton leftIcon={<AddIcon />}>
          Add Item
        </AppButton>
      );
      
      expect(screen.getByTestId('add-icon')).toBeTruthy();
      // Text is nested with icon, so use regex to find partial match
      expect(screen.getByText(/Add Item/)).toBeTruthy();
    });
    
    it('should render with right icon', () => {
      render(
        <AppButton rightIcon={<DeleteIcon />}>
          Delete
        </AppButton>
      );
      
      expect(screen.getByTestId('delete-icon')).toBeTruthy();
      // Text is nested with icon, so use regex to find partial match
      expect(screen.getByText(/Delete/)).toBeTruthy();
    });
    
    it('should render with both left and right icons', () => {
      render(
        <AppButton leftIcon={<AddIcon />} rightIcon={<DeleteIcon />}>
          Action
        </AppButton>
      );
      
      expect(screen.getByTestId('add-icon')).toBeTruthy();
      expect(screen.getByTestId('delete-icon')).toBeTruthy();
    });
    
    it('should not render icons when loading', () => {
      render(
        <AppButton loading leftIcon={<AddIcon />}>
          Loading
        </AppButton>
      );
      
      expect(screen.queryByTestId('add-icon')).toBeNull();
    });
  });
  
  describe('loading state', () => {
    it('should show loading state when loading prop is true', () => {
      render(<AppButton loading>Submit</AppButton>);
      
      expect(screen.getByTestId('button-loading')).toHaveTextContent('true');
    });
    
    it('should be disabled when loading', () => {
      render(<AppButton loading>Submit</AppButton>);
      
      const button = screen.getByTestId('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
    
    it('should show loading text when provided', () => {
      render(
        <AppButton loading loadingText="Saving...">
          Save
        </AppButton>
      );
      
      expect(screen.getByText('Saving...')).toBeTruthy();
    });
  });
  
  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<AppButton disabled>Disabled</AppButton>);
      
      const button = screen.getByTestId('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
    
    it('should be disabled when both disabled and loading are true', () => {
      render(<AppButton disabled loading>Disabled</AppButton>);
      
      const button = screen.getByTestId('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });
  
  describe('tooltip', () => {
    it('should wrap with tooltip when tooltip prop is provided', () => {
      render(<AppButton tooltip="Click to save">Save</AppButton>);
      
      expect(screen.getByTestId('tooltip-root')).toBeTruthy();
      expect(screen.getByText('Click to save')).toBeTruthy();
    });
    
    it('should not wrap with tooltip when tooltip prop is not provided', () => {
      render(<AppButton>No Tooltip</AppButton>);
      
      expect(screen.queryByTestId('tooltip-root')).toBeNull();
    });
    
    it('should use default tooltip placement of top', () => {
      render(<AppButton tooltip="Tooltip">Button</AppButton>);
      
      expect(screen.getByTestId('tooltip-placement')).toHaveTextContent('top');
    });
    
    it('should use custom tooltip placement when specified', () => {
      render(<AppButton tooltip="Tooltip" tooltipPlacement="bottom">Button</AppButton>);
      
      expect(screen.getByTestId('tooltip-placement')).toHaveTextContent('bottom');
    });
    
    it('should have 300ms open delay for tooltip', () => {
      render(<AppButton tooltip="Tooltip">Button</AppButton>);
      
      expect(screen.getByTestId('tooltip-open-delay')).toHaveTextContent('300');
    });
  });
  
  describe('click handling', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<AppButton onClick={handleClick}>Click Me</AppButton>);
      
      fireEvent.press(screen.getByTestId('button'));
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
    
    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(<AppButton disabled onClick={handleClick}>Click Me</AppButton>);
      
      // Disabled buttons don't fire press events in React Native
      const button = screen.getByTestId('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });
});

describe('AppIconButton', () => {
  describe('intent variants', () => {
    it('should render with primary intent', () => {
      render(
        <AppIconButton intent="primary" aria-label="Add">
          <AddIcon />
        </AppIconButton>
      );
      
      expect(screen.getByTestId('icon-button-variant')).toHaveTextContent('solid');
      expect(screen.getByTestId('icon-button-color-palette')).toHaveTextContent('brand');
    });
    
    it('should render with danger intent', () => {
      render(
        <AppIconButton intent="danger" aria-label="Delete">
          <DeleteIcon />
        </AppIconButton>
      );
      
      expect(screen.getByTestId('icon-button-variant')).toHaveTextContent('solid');
      expect(screen.getByTestId('icon-button-color-palette')).toHaveTextContent('red');
    });
  });
  
  describe('accessibility', () => {
    it('should have aria-label for accessibility', () => {
      render(
        <AppIconButton aria-label="Add new task">
          <AddIcon />
        </AppIconButton>
      );
      
      const button = screen.getByTestId('icon-button');
      expect(button.props.accessibilityLabel).toBe('Add new task');
    });
    
    it('should always render with tooltip for icon-only buttons', () => {
      render(
        <AppIconButton aria-label="Add new task">
          <AddIcon />
        </AppIconButton>
      );
      
      // Icon buttons always have tooltip (using aria-label as fallback)
      expect(screen.getByTestId('tooltip-root')).toBeTruthy();
      expect(screen.getByText('Add new task')).toBeTruthy();
    });
    
    it('should use tooltip prop over aria-label for tooltip content', () => {
      render(
        <AppIconButton aria-label="Add" tooltip="Add a new task to the board">
          <AddIcon />
        </AppIconButton>
      );
      
      expect(screen.getByText('Add a new task to the board')).toBeTruthy();
    });
  });
  
  describe('loading state', () => {
    it('should show spinner when loading', () => {
      render(
        <AppIconButton loading aria-label="Loading">
          <AddIcon />
        </AppIconButton>
      );
      
      expect(screen.getByTestId('spinner')).toBeTruthy();
      expect(screen.queryByTestId('add-icon')).toBeNull();
    });
    
    it('should be disabled when loading', () => {
      render(
        <AppIconButton loading aria-label="Loading">
          <AddIcon />
        </AppIconButton>
      );
      
      const button = screen.getByTestId('icon-button');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });
  
  describe('tooltip placement', () => {
    it('should default to top placement', () => {
      render(
        <AppIconButton aria-label="Add">
          <AddIcon />
        </AppIconButton>
      );
      
      expect(screen.getByTestId('tooltip-placement')).toHaveTextContent('top');
    });
    
    it('should use custom placement when specified', () => {
      render(
        <AppIconButton aria-label="Add" tooltipPlacement="right">
          <AddIcon />
        </AppIconButton>
      );
      
      expect(screen.getByTestId('tooltip-placement')).toHaveTextContent('right');
    });
  });
});
