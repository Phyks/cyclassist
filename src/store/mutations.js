import Vue from 'vue';

import { messages, getBrowserLocales } from '@/i18n';
import { storageAvailable } from '@/tools';
import { DEFAULT_TILE_SERVER, TILE_SERVERS, VERSION } from '@/constants';
import * as types from './mutations-types';

function loadDataFromStorage(name) {
    try {
        const value = localStorage.getItem(name);
        if (value) {
            return JSON.parse(value);
        }
        return null;
    } catch (e) {
        console.error(`Unable to load data from storage using key ${name}: ${e}.`);
        return null;
    }
}

function handleMigrations() {
    if (!storageAvailable('localStorage')) {
        return;
    }
    const version = loadDataFromStorage('version');

    // Migration from pre-0.1 to 0.1
    if (version === null) {
        const preventSuspend = loadDataFromStorage('preventSuspend');
        if (preventSuspend !== null) {
            localStorage.setItem('hasPreventSuspendPermission', JSON.stringify(preventSuspend));
        }
        localStorage.removeItem('preventSuspend');
        localStorage.setItem('version', JSON.stringify(VERSION));
    }
}

// Load unsent reports from storage
let unsentReports = null;
if (storageAvailable('localStorage')) {
    unsentReports = loadDataFromStorage('unsentReports');
}

// Load settings from storage
let locale = null;
let hasGeolocationPermission = null;
let hasPermanentNotificationPermission = null;
let hasPlaySoundPermission = null;
let hasPreventSuspendPermission = null;
let hasVibratePermission = null;
let shouldAutorotateMap = null;
let skipOnboarding = null;
let tileServer = null;
if (storageAvailable('localStorage')) {
    handleMigrations();

    hasGeolocationPermission = loadDataFromStorage('hasGeolocationPermission');
    hasPermanentNotificationPermission = loadDataFromStorage('hasPermanentNotificationPermission');
    hasPlaySoundPermission = loadDataFromStorage('hasPlaySoundPermission');
    hasPreventSuspendPermission = loadDataFromStorage('hasPreventSuspendPermission');
    hasVibratePermission = loadDataFromStorage('hasVibratePermission');
    shouldAutorotateMap = loadDataFromStorage('shouldAutorotateMap');
    skipOnboarding = loadDataFromStorage('skipOnboarding');

    tileServer = loadDataFromStorage('tileServer');
    if (tileServer && !TILE_SERVERS[tileServer] && !tileServer.startsWith('custom:')) {
        tileServer = null;
    }

    locale = loadDataFromStorage('locale');
    if (!(locale in messages)) {
        locale = null;
    }
    if (!locale) {
        // Get best matching locale from browser
        const locales = getBrowserLocales();
        for (let i = 0; i < locales.length; i += 1) {
            if (messages[locales[i]]) {
                locale = locales[i];
                break; // Break at first matching locale
            }
        }
    }
}

export const initialState = {
    hasGoneThroughIntro: false,
    hasVibratedOnce: false,
    isLoading: false,
    location: {
        error: null,
        gpx: [],
        watcherID: null,
    },
    lastReportFetchingLocation: [null, null],
    map: {
        center: [null, null],
        zoom: null,
    },
    reportDetails: {
        id: null,
        previousId: null,
        userAsked: null,
    },
    reports: [],
    unsentReports: unsentReports || [],
    settings: {
        locale: locale || 'en',
        hasGeolocationPermission: (
            hasGeolocationPermission !== null ? hasGeolocationPermission : true
        ),
        hasPermanentNotificationPermission: (
            hasPermanentNotificationPermission !== null ? hasPermanentNotificationPermission : true
        ),
        hasPlaySoundPermission: (
            hasPlaySoundPermission !== null ? hasPlaySoundPermission : true
        ),
        hasPreventSuspendPermission: (
            hasPreventSuspendPermission !== null ? hasPreventSuspendPermission : true
        ),
        hasVibratePermission: (
            hasVibratePermission !== null ? hasVibratePermission : true
        ),
        shouldAutorotateMap: shouldAutorotateMap !== null ? shouldAutorotateMap : false,
        skipOnboarding: skipOnboarding || false,
        tileServer: tileServer || DEFAULT_TILE_SERVER,
    },
};

export const mutations = {
    [types.HAS_VIBRATED_ONCE](state) {
        state.hasVibratedOnce = true;
    },
    [types.INTRO_WAS_SEEN](state) {
        state.hasGoneThroughIntro = true;
    },
    [types.INTRO_WAS_UNSEEN](state) {
        state.hasGoneThroughIntro = false;
    },
    [types.IS_DONE_LOADING](state) {
        state.isLoading = false;
    },
    [types.IS_LOADING](state) {
        state.isLoading = true;
    },
    [types.PUSH_REPORT](state, { report }) {
        const reportIndex = state.reports.findIndex(item => item.id === report.id);
        if (reportIndex === -1) {
            state.reports.push(report);
        } else {
            Vue.set(state.reports, reportIndex, report);
        }
    },
    [types.PUSH_UNSENT_REPORT](state, { report }) {
        state.unsentReports.push(report);
        if (storageAvailable('localStorage')) {
            localStorage.setItem('unsentReports', JSON.stringify(state.unsentReports));
        }
    },
    [types.REMOVE_UNSENT_REPORT](state, { index }) {
        state.unsentReports.splice(index, 1);
        if (storageAvailable('localStorage')) {
            localStorage.setItem('unsentReports', JSON.stringify(state.unsentReports));
        }
    },
    [types.SET_CURRENT_MAP_CENTER](state, { center }) {
        Vue.set(state.map, 'center', center);
    },
    [types.SET_CURRENT_MAP_ZOOM](state, { zoom }) {
        Vue.set(state.map, 'zoom', zoom);
    },
    [types.SET_CURRENT_POSITION](state, { currentLocation }) {
        state.location.gpx.push(currentLocation);
    },
    [types.SET_LAST_REPORT_FETCHING_LOCATION](state, { locationLatLng }) {
        state.lastReportFetchingLocation = locationLatLng;
    },
    [types.SET_LOCATION_ERROR](state, { error }) {
        Vue.set(state.location, 'error', error);
    },
    [types.SET_LOCATION_WATCHER_ID](state, { id }) {
        Vue.set(state.location, 'watcherID', id);
    },
    [types.SET_SETTING](state, { setting, value }) {
        if (storageAvailable('localStorage')) {
            localStorage.setItem(setting, JSON.stringify(value));
        }
        state.settings[setting] = value;
    },
    [types.SHOW_REPORT_DETAILS](state, { id, userAsked }) {
        if (id === null) {
            // If closing the details, keep track of what the id was to prevent
            // reopening the details immediately.
            Vue.set(state.reportDetails, 'previousId', state.reportDetails.id);
        }
        Vue.set(state.reportDetails, 'id', id);
        Vue.set(state.reportDetails, 'userAsked', userAsked);
    },
    [types.STORE_REPORTS](state, { reports }) {
        state.reports = reports;
    },
};
