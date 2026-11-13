import { createContext, useState, useContext, useEffect } from 'react';
import API from '../utils/api';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({
    school_name: 'International Cambridge School Kishtwar',
    school_subtitle: 'Kishtwar, Jammu & Kashmir',
    school_address: 'Kishtwar, Jammu & Kashmir',
    school_phone: '',
    school_email: 'info@cambridgeschoolkishtwar.com',
    school_logo_url: '',
    receipt_footer: 'This is a computer-generated receipt. No signature required.',
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    API.get('/settings')
      .then(res => {
        setSettings(res.data);
      })
      .catch(err => console.error('Failed to load global settings', err))
      .finally(() => setLoadingSettings(false));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loadingSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
