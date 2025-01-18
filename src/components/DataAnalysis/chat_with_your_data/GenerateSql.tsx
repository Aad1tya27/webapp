import { generateWebsocketUrl } from '@/helpers/websocket';
import { ArrowCircleUp } from '@mui/icons-material';
import { Box, Button, TextField } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import useWebSocket from 'react-use-websocket';

export const GenerateSql = ({
  aiGeneratedSql,
  triggerRefreshThreads,
}: {
  aiGeneratedSql: string;
  triggerRefreshThreads: (...args: any) => void;
}) => {
  const { data: session }: any = useSession();
  const [socketUrl, setSocketUrl] = useState<string | null>(null);
  const [sqlFilterDataPrompt, setSqlFilterDataPrompt] = useState<string>('');

  const {
    sendJsonMessage,
    lastJsonMessage,
  }: {
    sendJsonMessage: (...args: any) => any;
    lastJsonMessage: { data: any; status: string; message: string } | null;
  } = useWebSocket(socketUrl, {
    share: true,
    onError(event) {
      console.error('Socket error:', event);
    },
  });

  useEffect(() => {
    if (session) {
      setSocketUrl(generateWebsocketUrl('chat/bot', session));
    }
  }, [session]);

  const onSubmitSqlFilterDataPrompt = () => {
    // start the thread
    sendJsonMessage({
      action: 'generate_sql_and_start_thread',
      params: {
        user_prompt: sqlFilterDataPrompt,
      },
    });
  };

  useEffect(() => {
    if (lastJsonMessage) {
      if (lastJsonMessage.status === 'success') {
        // make sure the lastest thread is set to current thread
        triggerRefreshThreads();
        console.log('Success:', lastJsonMessage.message);
      } else {
        console.error('Error:', lastJsonMessage.message);
      }
    }
  }, [lastJsonMessage]);

  return (
    <>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <TextField
            placeholder="Enter your customized prompt here"
            multiline
            rows={1}
            fullWidth
            value={sqlFilterDataPrompt}
            onChange={(e) => setSqlFilterDataPrompt(e.target.value)}
            sx={{
              flexGrow: 1,
              borderRadius: '5px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)',
            }}
          />
          <ArrowCircleUp
            onClick={onSubmitSqlFilterDataPrompt}
            sx={{ cursor: 'pointer', width: '50px', height: '50px', color: 'green' }}
          />
        </Box>

        {aiGeneratedSql && (
          <Box sx={{ marginTop: '1rem' }}>
            <TextField
              id="outlined-multiline-static"
              label="Generated SQL"
              multiline
              rows={4}
              fullWidth
              value={aiGeneratedSql}
              variant="outlined"
            />
            <Button>Run</Button>
          </Box>
        )}
      </Box>
    </>
  );
};
