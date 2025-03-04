import { TopBar } from '@/components/DataAnalysis/TopBar';
import {
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Divider,
  TextField,
  Typography,
} from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';

import { httpGet, httpPost } from '@/helpers/http';
import { errorToast, successToast } from '@/components/ToastMessage/ToastHelper';
import { delay } from '@/utils/common';
import { PreviewTable } from '@/components/DataAnalysis/v2DataAnalysis/PreviewTable';
import { SQLText } from './SqlText';
import { AISummary } from './AISummary';
import { downloadCSV, MODALS } from '@/pages/analysis/data-analysis';
import { OverWriteDialog } from '../OverwriteBox';
import { SavedSession } from '../SavedSession';
import { useRouter } from 'next/router';

interface ProgressResult {
  response?: Array<any>;
  session_id?: string;
}

interface ProgressEntry {
  message: string;
  status: 'running' | 'completed' | 'failed';
  result?: ProgressResult;
}

interface ProgressResponse {
  progress: ProgressEntry[];
}

const removeTrailingSemiColon = (sql: string) => {
  return sql.endsWith(';') ? sql.slice(0, -1) : sql;
};

export const AnalysisContainer = () => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [loading, setLoading] = useState(false);
  const [openSavedSessionDialog, setOpenSavedSessionDialog] = useState(false);
  const [isBoxOpen, setIsBoxOpen] = useState(false);
  const [modalName, setModalName] = useState(MODALS.SAVE);
  const [selectedSession, setSelectedSession] = useState();
  const [savedSql, setSavedSql] = useState('');
  const [resetState, setResetState] = useState(true);
  const [attemptedRoute, setAttemptedRoute] = useState(null);
  const router = useRouter();
  const { dispatch, state } = globalContext?.UnsavedChanges ?? {};

  const [{ newSessionId, ...oldSessionMetaInfo }, setSessionMetaInfo] = useState({
    newSessionId: '',
    session_status: '',
    sqlText: '',
    taskId: '',
    session_name: '',
    oldSessionId: '',
  });
  const { control, setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      prompt: '',
      sqlText: '',
      summary: '',
    },
  });

  const handleEditSession = (info: any, openEdit: boolean) => {
    setSelectedSession(info);
    //shows me a modal asking to save the generated summary.
    if (newSessionId && !openEdit) {
      setIsBoxOpen(true);
      setModalName(MODALS.EDIT_SESSION_WARNING);
      return;
    }
    setSavedSql(info.sqlText);
    setValue('sqlText', info.sqlText);
    setValue('prompt', info.prompt);
    if (info.summary) {
      setValue('summary', info.summary);
    }
    setSessionMetaInfo({
      newSessionId: '',
      ...oldSessionMetaInfo,
      ...info,
    });
  };

  const handleCloseSavedSession = () => {
    setOpenSavedSessionDialog(false);
  };
  const handleOpenSavedSession = () => {
    setOpenSavedSessionDialog(true);
  };

  const user_prompt = watch('prompt');
  const sqlText = watch('sqlText');
  const summary = watch('summary');

  const pollForTaskRun = async (taskId: string) => {
    setLoading(true);
    try {
      const response: ProgressResponse = await httpGet(session, 'tasks/stp/' + taskId);
      const lastMessage: any =
        response['progress'] && response['progress'].length > 0
          ? response['progress'][response['progress'].length - 1]
          : null;

      if (!['completed', 'failed'].includes(lastMessage?.status)) {
        await delay(3000);
        await pollForTaskRun(taskId);
      } else if (lastMessage?.status === 'failed') {
        errorToast(lastMessage?.message, [], globalContext);
        return;
      } else if (lastMessage?.status === 'completed') {
        successToast(lastMessage?.message, [], globalContext);
        //sql is generated using wren.
        if ('sql' in lastMessage.result) {
          setValue('sqlText', lastMessage?.result?.sql);
        } else {
          setValue('summary', lastMessage?.result?.response[0]?.response);
        }
        setSessionMetaInfo({
          ...oldSessionMetaInfo,
          newSessionId: lastMessage?.result?.session_id,
        });
      }
    } catch (err: any) {
      console.error(err.message);
      errorToast(err.message, [], globalContext);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSql = async () => {
    setLoading(true);
    try {
      const response: { request_uuid: string } = await httpPost(session, `warehouse/v1/ask/`, {
        user_prompt,
      });
      if (!response?.request_uuid) {
        errorToast('Something went wrong', [], globalContext);
        return { error: 'ERROR' };
      }
      await delay(3000);
      pollForTaskRun(response.request_uuid);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      errorToast(err.message, [], globalContext);
    }
  };

  const handleSummarize = async () => {
    const sessionID = newSessionId ? newSessionId : oldSessionMetaInfo.oldSessionId;
    setLoading(true);
    try {
      const response: { request_uuid: string } = await httpPost(
        session,
        `warehouse/v1/ask/${sessionID}/summarize/`,
        {
          sql: removeTrailingSemiColon(sqlText),
          user_prompt: 'Summarize the results of the query',
        }
      );
      if (!response?.request_uuid) {
        errorToast('Something went wrong', [], globalContext);
        return { error: 'ERROR' };
      }

      successToast(`Data analysis initiated successfully`, [], globalContext);
      await delay(3000);
      await pollForTaskRun(response.request_uuid);
    } catch (err: any) {
      console.error(err);
      setLoading(false);
      errorToast(err.message, [], globalContext);
    }
  };

  const onSubmit = (sessionName: string, overwrite: boolean) => {
    const oldSessionIdToSend = overwrite ? oldSessionMetaInfo.oldSessionId : null;
    handleSaveSession(overwrite, oldSessionIdToSend, sessionName);
  };

  const handleNewSession = (shouldRefreshState: boolean | undefined) => {
    //should refreshstate is when the save or overwrite api works.
    // !newSessionId is for the case when a old session is opened so it has only oldsessionId.
    if (shouldRefreshState || !newSessionId || !oldSessionMetaInfo.session_name) {
      setSessionMetaInfo({
        newSessionId: '',
        session_status: '',
        sqlText: '',
        taskId: '',
        session_name: '',
        oldSessionId: '',
      });
      reset();
    }
    setResetState(true);
  };

  const handleSaveSession = async (
    overwrite: boolean,
    old_session_id: string | null,
    session_name: string
  ) => {
    const sessionID = newSessionId ? newSessionId : oldSessionMetaInfo.oldSessionId;

    try {
      const response: { success: number } = await httpPost(
        session,
        `warehouse/v1/ask/${sessionID}/save/`,
        {
          session_name,
          overwrite,
          old_session_id,
          sql: removeTrailingSemiColon(sqlText),
        }
      );
      if (response.success) {
        successToast(`${session_name} saved successfully`, [], globalContext);
        handleNewSession(true);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setIsBoxOpen(false);
    }
  };

  const sqlChanged = sqlText !== savedSql;

  const handleFeedback = async (session_id: string, feedback: string) => {
    try {
      const response: { success: number } = await httpPost(
        session,
        `warehouse/ask/${session_id}/feedback/`,
        {
          feedback,
        }
      );
      if (response.success) {
        successToast(`Feedback sent successfully`, [], globalContext);
      }
    } catch (err: any) {
      errorToast(err.message, [], globalContext);
    } finally {
      setIsBoxOpen(false);
    }
  };

  const submitFeedback = (feedback: string) => {
    let sessionIdToSend: any;
    if (newSessionId) {
      // if we have a newsession or if we have oldsession but again create a new summary (both oldsessionid and newsessionid).
      sessionIdToSend = newSessionId;
    } else if (oldSessionMetaInfo.oldSessionId) {
      //during edit when we have a oldsession id.
      sessionIdToSend = oldSessionMetaInfo.oldSessionId;
    }
    handleFeedback(sessionIdToSend, feedback);
  };

  //Warns user to save the session before moving to some other tab.
  useEffect(() => {
    const handleRouteChange = (url: any) => {
      if (
        (oldSessionMetaInfo.oldSessionId && newSessionId && state === false) ||
        (newSessionId && !oldSessionMetaInfo.oldSessionId && state === false)
      ) {
        router.events.emit('routeChangeError');
        setModalName(MODALS.UNSAVED_CHANGES);
        setIsBoxOpen(true);
        dispatch({ type: 'SET_UNSAVED_CHANGES' });
        setAttemptedRoute(url);
        throw 'Unsaved changes, route change aborted';
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);

    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
      dispatch({ type: 'CLEAR_UNSAVED_CHANGES' });
    };
  }, [router, oldSessionMetaInfo.oldSessionId, state, newSessionId]);

  const onConfirmNavigation = () => {
    if (attemptedRoute) {
      dispatch({ type: 'SET_UNSAVED_CHANGES' });
      router.push(attemptedRoute);
    }
  };

  return (
    <>
      {loading && (
        <>
          <Backdrop
            open={!!loading}
            sx={{
              zIndex: 1300,
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <>
              <CircularProgress sx={{ color: '#FFFFFF' }} />
              <Typography sx={{ fontWeight: '600', fontSize: '20px', color: '#FFFFFF' }}>
                Prepping your data output...
              </Typography>
            </>
          </Backdrop>
        </>
      )}

      <Box
        sx={{
          width: '100%',
          height: '90vh',
          boxShadow: '0 4px 8px rgba(9, 37, 64, 0.08)',
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1rem 2rem',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            height: '100%',
            flexDirection: 'column',
            gap: '1rem',
            padding: '1rem',
          }}
        >
          {/* Top Bar */}
          <TopBar
            handleOpenSavedSession={handleOpenSavedSession}
            handleNewSession={handleNewSession}
          />

          {/* SQL Input Field - Should Take Up Available Space */}
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: '10px',
              padding: '1rem',
              backgroundColor: '#F8FAFC',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden', // Prevents unwanted scrolling
              width: '100%',
            }}
          >
            {/* Scrollable Content */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto', // Makes this section scrollable
                width: '100%',
                paddingRight: '10px', // Optional: Prevents scrollbar overlap
                paddingBottom: '2rem',
              }}
            >
              {/* Section: SQL AI Generated */}
              <Typography
                sx={{ fontSize: '18px', fontWeight: 'bold', color: '#333', mb: 1, mt: 2 }}
              >
                SQL AI Generated
              </Typography>
              <Divider sx={{ width: '100%', mb: 2 }} />
              <SQLText sqlText={sqlText} control={control} />

              {/* Section: Preview Data Table */}
              <Typography
                sx={{ fontSize: '18px', fontWeight: 'bold', color: '#333', mb: 1, mt: 3 }}
              >
                Preview Data Table
              </Typography>
              <Divider sx={{ width: '100%', mb: 2 }} />

              <PreviewTable
                sqlText={removeTrailingSemiColon(sqlText)}
                sessionName={oldSessionMetaInfo.session_name}
                sqlChanged={sqlChanged}
              />

              {/* Section: Summary */}
              <Typography
                sx={{ fontSize: '18px', fontWeight: 'bold', color: '#333', mb: 1, mt: 3 }}
              >
                Summary
              </Typography>
              <Divider sx={{ width: '100%', mb: 2 }} />

              {summary ? (
                <AISummary
                  summary={summary}
                  setIsBoxOpen={setIsBoxOpen}
                  setModalName={setModalName}
                />
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '', //checkthis
                  }}
                >
                  {!sqlText ? (
                    <Typography
                      sx={{ color: 'grey', fontSize: '16px', fontStyle: 'italic', width: '100%' }}
                    >
                      View the text analysis of the data here...
                    </Typography>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      disabled={!sqlText}
                      onClick={handleSummarize}
                    >
                      Summarize
                    </Button>
                  )}
                </Box>
              )}
            </Box>

            {/* Bottom Button Section (Sticky) */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                padding: '10px 0', // Adds spacing
                backgroundColor: '#F8FAFC',
                borderTop: '1px solid #ccc',
                position: 'sticky',
                bottom: 0,
                width: '100%',
              }}
            >
              <Button
                variant="outlined"
                disabled={!sqlText}
                onClick={() => {
                  setModalName(oldSessionMetaInfo.oldSessionId ? MODALS.OVERWRITE : MODALS.SAVE);
                  setIsBoxOpen(true);
                }}
                sx={{
                  width: '6.75rem',
                  padding: '6px',
                  borderRadius: '6px',
                  boxShadow: '0px 2px 4px 0px #09254029',
                }}
              >
                Save as
              </Button>
              <Button
                variant="contained"
                sx={{ width: '6.75rem', padding: '6px', borderRadius: '6px' }}
                disabled={!sqlText}
                onClick={() => {
                  downloadCSV(oldSessionMetaInfo, user_prompt, summary, newSessionId);
                }}
              >
                Download
              </Button>
            </Box>
          </Box>

          {/* Prompt + Button Wrapper - Always at Bottom */}
          <form
            onSubmit={(e) => {
              e.preventDefault(); // Prevent page refresh
              handleGenerateSql(); // Trigger the submit action
            }}
            style={{ width: '100%' }} // Ensure full width for proper alignment
          >
            <Box
              sx={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                marginTop: 'auto',
              }}
            >
              {/* Prompt Input */}
              <Controller
                name="prompt"
                control={control}
                render={({ field }) => (
                  <TextField
                    data-testid="prompt-box"
                    id="outlined-multiline-static"
                    sx={{
                      borderRadius: '6px',
                      flexGrow: 1,
                      '& .MuiInputBase-root': {
                        minHeight: '56px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                      },
                    }}
                    placeholder="Enter a prompt"
                    fullWidth
                    multiline
                    minRows={1}
                    maxRows={6}
                    {...field}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault(); // Prevent new line
                        handleGenerateSql(); // Call submit function
                      }
                    }}
                    InputProps={{
                      style: {
                        backgroundColor: '#E8F5F5',
                        borderRadius: '6px',
                      },
                    }}
                  />
                )}
              />

              {/* Submit Button */}
              <Button
                variant="contained"
                id="create-new-button"
                sx={{
                  minHeight: '52px',
                  padding: '0.4rem',
                  width: '8rem',
                  alignSelf: 'flex-end',
                  backgroundColor: '#00897B',
                  color: '#FFFFFF',
                  '&:hover': {
                    backgroundColor: '#00695C',
                  },
                  '&:disabled': {
                    backgroundColor: '#E0E0E0',
                    color: '#9E9E9E',
                  },
                }}
                type="submit" // Ensures form submission when Enter is pressed
              >
                Submit
              </Button>
            </Box>
          </form>
        </Box>

        {/* Saved Session Dailog */}
        {openSavedSessionDialog && (
          <SavedSession
            open={openSavedSessionDialog}
            onClose={handleCloseSavedSession}
            handleEditSession={handleEditSession}
            version="v1"
          />
        )}

        {isBoxOpen && (
          <OverWriteDialog
            open={isBoxOpen}
            setIsBoxOpen={setIsBoxOpen}
            modalName={modalName}
            onSubmit={onSubmit}
            submitFeedback={submitFeedback}
            onConfirmNavigation={onConfirmNavigation}
            handleNewSession={handleNewSession}
            setModalName={setModalName}
            oldSessionMetaInfo={oldSessionMetaInfo}
            handleEditSession={handleEditSession}
            selectedSession={selectedSession}
          />
        )}
      </Box>
    </>
  );
};
