'use client';
import { useEffect } from 'react';

let chatLoaded = false;

export default function LiveservChat() {
    useEffect(() => {
        if (chatLoaded) return;
        chatLoaded = true;

        const ts = Date.now();
        const browserUrl = encodeURIComponent(window.location.href);
        const userAgent = encodeURIComponent(navigator.userAgent);
        const refUrl = encodeURIComponent(document.referrer || 'direct');

        const widgetSrc =
            'https://sub1.livserv.in/livserv/livservtemp3/GetLivservWindow.jsp' +
            '?did=11912&pid=1&cs_id=1' +
            '&refUrl=' + refUrl +
            '&opSystem=Web&browserName=Chrome' +
            '&browserUrl=' + browserUrl +
            '&ls_searchkey=&ls_campid=0&exParam=null' +
            '&userAgent=' + userAgent +
            '&repeatVisIds=&gaclientId=' +
            '&pCsid=NA&pSrvid=NA&pInitSess=NA' +
            '&count=' + ts;

        // Step 1: Load GetLivservWindow.jsp first (defines globals like `did`, `allText`)
        const widget = document.createElement('script');
        widget.src = widgetSrc;
        widget.async = false; // synchronous — must finish before chat_temp.js runs

        // Step 2: Only after widget script is done, load chat_temp.js
        widget.onload = () => {
            const tmpl = document.createElement('script');
            tmpl.src = 'https://cwc.livserv.in/uploads/Templates/aster-pro/chat_temp.js';
            tmpl.async = false;
            document.body.appendChild(tmpl);
        };

        document.body.appendChild(widget);
    }, []);

    return null;
}