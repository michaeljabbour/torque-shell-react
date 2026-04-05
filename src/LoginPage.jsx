import { useState } from 'react';
import Box from '@mui/material/Box';
import { useAuth } from './AuthContext.jsx';
import { renderDescriptor } from './renderer.jsx';

export default function LoginPage({ branding = {} }) {
  const { login } = useAuth();
  const [fields, setFields] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleFieldChange = (name, value) => {
    setFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignIn = async () => {
    setError('');
    try {
      await login(fields.email, fields.password);
    } catch (err) {
      setError(err.message);
    }
  };

  const descriptor = {
    type: 'stack',
    props: { spacing: 2 },
    children: [
      {
        type: 'text',
        props: {
          content: `Sign in to ${branding?.name || 'Torque'}`,
          variant: 'h5',
        },
      },
      ...(error
        ? [
            {
              type: 'alert',
              props: { severity: 'error', content: error },
            },
          ]
        : []),
      {
        type: 'text-field',
        props: {
          label: 'Email',
          name: 'email',
          value: fields.email,
          onChange: handleFieldChange,
        },
      },
      {
        type: 'text-field',
        props: {
          label: 'Password',
          name: 'password',
          type: 'password',
          value: fields.password,
          onChange: handleFieldChange,
        },
      },
      {
        type: 'button',
        props: {
          label: 'Sign in',
          variant: 'contained',
          fullWidth: true,
          onClick: handleSignIn,
        },
      },
    ],
  };

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{ maxWidth: 320, width: '100%' }}>{renderDescriptor(descriptor)}</Box>
    </Box>
  );
}
