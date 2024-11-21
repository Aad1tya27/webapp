import { useTracking } from '@/contexts/TrackingContext';
import { httpPut } from '@/helpers/http';
import { Box, Button, Dialog, DialogActions, DialogTitle, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { errorToast } from '../ToastMessage/ToastHelper';
import { useContext } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';

type Org = {
  name: string;
  slug: string;
  airbyte_workspace_id: string;
  viz_url: string | null;
  viz_login_type: string | null;
  is_demo: boolean;
};

export const Disclaimer = ({
  open,
  setIsOpen,
  isOrgPrefernce = false,
}: {
  open: boolean;
  setIsOpen: any;
  isOrgPrefernce: boolean;
}) => {
  const { data: session } = useSession();
  const trackAmplitudeEvent: any = useTracking();
  const globalContext = useContext(GlobalContext);

  const handleUserPreference = async () => {
    try {
      const { success } = await httpPut(session, 'userpreferences/', {
        disclaimer_shown: true,
      });
      if (!success) {
        errorToast('Something went wrong', [], globalContext);
        return;
      }
    } catch (error: any) {
      console.error(error, 'error');
      errorToast(error.message, [], globalContext);

      return;
    } finally {
      setIsOpen(false);
    }
  };
  // isOrgPrefernce
  const handleOrgPreference = async () => {
    try {
      const { success } = await httpPut(session, 'orgpreferences/llm_approval', {
        llm_optin: true,
      });
      if (!success) {
        errorToast('Something went wrong', [], globalContext);
        return;
      }
    } catch (error: any) {
      console.error(error, 'error');
      errorToast(error.message, [], globalContext);
      return;
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: { borderRadius: '8px', padding: ' 2.3rem 3rem', width: '480px' },
      }}
    >
      <DialogTitle variant="h5" fontWeight={700} sx={{ padding: '0' }}>
        <Box display="flex" alignItems="center">
          <Box flexGrow={1}>Disclaimer</Box>
        </Box>
      </DialogTitle>
      <DialogTitle flexGrow={1} sx={{ padding: '0', mt: '1.5rem' }}>
        {' '}
        <Typography sx={{ lineHeight: '26px' }}>
          This content has been generated by an artificial intelligence language model, and it is
          provided as-is without any warranties or guarantees of accuracy. While we strive to
          deliver accurate and reliable content, please note that the information provided may not
          be entirely error-free or up-to-date. Any actions taken based on this content are at your
          own risk. We recommend seeking qualified expertise or conducting further research to
          validate and supplement the information provided. We disclaim any liability for damages or
          losses resulting from the use or reliance on this content.
        </Typography>
      </DialogTitle>
      <DialogActions
        sx={{
          mt: '2.3rem',
          justifyContent: 'flex-start',
          p: 0,
        }}
      >
        <Button
          onClick={() => {
            if (isOrgPrefernce) {
              handleOrgPreference();
              trackAmplitudeEvent('[AI-feature-Enabled] Button clicked');
            } else {
              trackAmplitudeEvent(`[Accept-llmDisclaimer-LLMSummary] Button Clicked`);
              handleUserPreference();
            }
          }}
          variant="contained"
          sx={{ width: '5rem' }}
        >
          Okay
        </Button>
      </DialogActions>
    </Dialog>
  );
};
