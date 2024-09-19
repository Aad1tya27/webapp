import React, { createContext, useContext, useEffect, useState } from 'react';
import * as amplitude from '@amplitude/analytics-browser';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

const amplitudeApiKey = process.env.NEXT_PUBLIC_AMPLITUDE_ENV!;
const TrackingContext = createContext(
  (eventName: string, additionalData: Record<string, any> = {}) => {}
);

export const TrackingProvider = ({ children }: any) => {
  const { data: session } = useSession();
  const router = useRouter();
  const globalContext = useContext(GlobalContext);
  const [eventProperties, setEventProperties] = useState({});

  useEffect(() => {
    if (!amplitudeApiKey) return;
    amplitude.init(amplitudeApiKey, {
      defaultTracking: {
        pageViews: false,
        sessions: true,
        attribution: true,
        formInteractions: true,
      },
    });
    if (session?.user?.email) {
      const userEmail: string = session.user.email;
      const ist4dMember = userEmail.includes('projecttech4dev.org');
      const identifyEvent = new amplitude.Identify();
      amplitude.setUserId(session.user.email);
      identifyEvent.setOnce('User_id', session.user.email);
      identifyEvent.setOnce('ist4dMember', ist4dMember);
      amplitude.setUserId(userEmail);
      amplitude.identify(identifyEvent);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (globalContext?.CurrentOrg) {
      const identifyEvent = new amplitude.Identify();
      identifyEvent.set('User_orgs', globalContext.CurrentOrg.state.name);
      amplitude.identify(identifyEvent);

      setEventProperties({
        userCurrentOrg: globalContext.CurrentOrg.state.name,
        userEmail: session?.user?.email,
        page_domain: window.location.hostname,
        page_location: window.location.href,
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
        page_url: window.location.href,
        referrer: document.referrer,
        referring_domain: document.referrer
          ? new URL(document.referrer).hostname
          : '',
      });

      amplitude.logEvent(
        `[${router.pathname}${window.location.search}] Page Viewed`,
        {
          userCurrentOrg: globalContext.CurrentOrg.state.name,
          userEmail: session?.user?.email,
          page_domain: window.location.hostname,
          page_location: window.location.href,
          page_path: window.location.pathname + window.location.search,
          page_title: document.title,
          page_url: window.location.href,
          referrer: document.referrer,
          referring_domain: document.referrer
            ? new URL(document.referrer).hostname
            : '',
        }
      );
    }
  }, [router.pathname, session, globalContext?.CurrentOrg]);
  const trackEvent = (
    eventName: string,
    additionalData: Record<string, any> = {}
  ) => {
    amplitude.track(eventName, {
      timestamp: new Date(),
      ...eventProperties,
      ...additionalData,
    });
  };

  return (
    <TrackingContext.Provider value={trackEvent}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  return useContext(TrackingContext);
};
