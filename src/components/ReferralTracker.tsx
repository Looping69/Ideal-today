
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ReferralTracker() {
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const ref = params.get('ref');
        const hostRef = params.get('host_ref');

        if (ref) {
            sessionStorage.setItem('referral_code', ref);
        }

        if (hostRef) {
            sessionStorage.setItem('host_referral_code', hostRef);
        }
    }, [location]);

    return null;
}
