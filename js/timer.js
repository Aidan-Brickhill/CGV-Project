let levelStartTime = null;
let levelEndTime = null;
let levelTimeElapsed = 0;
let isTimerPaused = false;
let pauseStartTime = null;

function resetTimer(){
    levelStartTime = null;
    levelEndTime = null;
    levelTimeElapsed = 0;
    isTimerPaused = false;
    pauseStartTime = null;
}

function startTimer() {
    if (isTimerPaused) {
        // If timer was paused, calculate the pause duration and subtract it from the start time
        const currentTime = new Date().getTime();
        const pauseDuration = currentTime - pauseStartTime;
        levelStartTime += pauseDuration;
        isTimerPaused = false;
    } else {
        levelStartTime = new Date().getTime();
        levelEndTime = null;
        levelTimeElapsed = 0;
    }
}

function pauseTimer() {
    if (!isTimerPaused && levelStartTime) {
        pauseStartTime = new Date().getTime();
        isTimerPaused = true;
    }
}

function resumeTimer() {
    if (isTimerPaused) {
        // If timer is paused, calculate the pause duration and add it to the start time
        const currentTime = new Date().getTime();
        const pauseDuration = currentTime - pauseStartTime;
        levelStartTime += pauseDuration;
        pauseStartTime = null;
        isTimerPaused = false;
    }
}

function stopTimer() {
    if (levelStartTime) {
        if (isTimerPaused) {
            // If timer is paused when stopped, calculate the pause duration and add it to the elapsed time
            const currentTime = new Date().getTime();
            const pauseDuration = currentTime - pauseStartTime;
            levelTimeElapsed += (pauseDuration / 1000); // Add paused time to elapsed time
        } else {
            levelEndTime = new Date().getTime();
            levelTimeElapsed = (levelEndTime - levelStartTime) / 1000; // Elapsed time in seconds
        }

        levelStartTime = null;
        pauseStartTime = null;
        isTimerPaused = false;
    }
}

function getElapsedSeconds() {
    // Format the elapsed time with three decimal places
    return levelTimeElapsed.toFixed(3);
}

export { resetTimer, startTimer, pauseTimer, resumeTimer, stopTimer, getElapsedSeconds };
