const header = document.querySelector('h1')
window.electronAPI.handleAppLaunch((event, value) => {
    header.innerText = value;
})
