/**
 * AppInput Component
 *
 * A styled input component that wraps Chakra UI Input with FormControl integration.
 * Provides consistent form field styling with support for labels, validation errors,
 * helper text, and input addons (left/right elements).
 *
 * @see Requirements: 13.1, 13.2, 13.3, 13.4, 13.8
 */

import React, { forwardRef } from 'react';
import {
  Box,
  Field,
  Group,
  Input,
  type InputProps,
} from '@chakra-ui/react';
import { FiAlertCircle } from 'react-icons/fi';

/**
 * Props for the AppInput component
 */
export interface AppInputProps extends Omit<InputProps, 'size'> {
  /** Form label displayed above the input */
  label?: string;
  /** Error message to display below the input */
  error?: string;
  /** Helper text displayed below the input when no error */
  helperText?: string;
  /** Whether the field is required (shows red asterisk) */
  isRequired?: boolean;
  /** Element to display on the left side of the input (icon or addon) */
  leftElement?: React.ReactNode;
  /** Element to display on the right side of the input (icon or addon) */
  rightElement?: React.ReactNode;
  /** Input size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * AppInput - Form input with FormControl integration
 *
 * Features:
 * - FormLabel with red asterisk for required fields (Req 13.8)
 * - FormErrorMessage with error icon (Req 13.3)
 * - FormHelperText for guidance (Req 13.2)
 * - InputGroup support for left/right elements (Req 13.4)
 * - Focus ring styling (Req 13.1)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AppInput label="Email" placeholder="Enter your email" />
 *
 * // With validation error
 * <AppInput
 *   label="Password"
 *   type="password"
 *   error="Password is required"
 *   isRequired
 * />
 *
 * // With left icon
 * <AppInput
 *   label="Search"
 *   leftElement={<FiSearch />}
 *   placeholder="Search..."
 * />
 * ```
 */
export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(
  (
    {
      label,
      error,
      helperText,
      isRequired = false,
      leftElement,
      rightElement,
      size = 'md',
      disabled,
      ...inputProps
    },
    ref
  ) => {
    const isInvalid = !!error;
    const hasAddons = leftElement || rightElement;

    // Render the input element (with or without group wrapper)
    const renderInput = () => {
      const inputElement = (
        <Input
          ref={ref}
          size={size}
          disabled={disabled}
          aria-invalid={isInvalid}
          aria-describedby={
            error
              ? `${inputProps.id || inputProps.name}-error`
              : helperText
                ? `${inputProps.id || inputProps.name}-helper`
                : undefined
          }
          {...inputProps}
        />
      );

      if (!hasAddons) {
        return inputElement;
      }

      return (
        <Group attached width="full">
          {leftElement && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              px="3"
              bg="bg.muted"
              borderWidth="1px"
              borderColor={isInvalid ? 'red.500' : 'border'}
              borderRightWidth="0"
              borderLeftRadius="md"
              color="fg.muted"
            >
              {leftElement}
            </Box>
          )}
          {React.cloneElement(inputElement, {
            borderLeftRadius: leftElement ? '0' : undefined,
            borderRightRadius: rightElement ? '0' : undefined,
          })}
          {rightElement && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              px="3"
              bg="bg.muted"
              borderWidth="1px"
              borderColor={isInvalid ? 'red.500' : 'border'}
              borderLeftWidth="0"
              borderRightRadius="md"
              color="fg.muted"
            >
              {rightElement}
            </Box>
          )}
        </Group>
      );
    };

    return (
      <Field.Root invalid={isInvalid} required={isRequired} disabled={disabled}>
        {label && (
          <Field.Label>
            {label}
            {isRequired && (
              <Box as="span" color="red.500" ml="1">
                *
              </Box>
            )}
          </Field.Label>
        )}

        {renderInput()}

        {error && (
          <Field.ErrorText
            id={`${inputProps.id || inputProps.name}-error`}
            display="flex"
            alignItems="center"
            gap="1"
          >
            <FiAlertCircle aria-hidden="true" />
            {error}
          </Field.ErrorText>
        )}

        {!error && helperText && (
          <Field.HelperText id={`${inputProps.id || inputProps.name}-helper`}>
            {helperText}
          </Field.HelperText>
        )}
      </Field.Root>
    );
  }
);

AppInput.displayName = 'AppInput';

export default AppInput;
