import { REPORT_VOTES_THRESHOLD } from '@/constants';

export function getLastLocation(state) {
    const gpx = state.location.gpx;
    if (gpx.length > 0) {
        return gpx[gpx.length - 1];
    }
    return null;
}

export function notDismissedReports(state) {
    return state.reports.filter((item) => {
        if (item.attributes.downvotes === 0) {
            return true;
        }
        return (item.attributes.upvotes / item.attributes.downvotes) > REPORT_VOTES_THRESHOLD;
    });
}
