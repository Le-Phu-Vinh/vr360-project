import { useState, useEffect, useRef } from 'react';

const useGamepad = () => {
    const [gamepad, setGamepad] = useState(null);
    const [buttonStates, setButtonStates] = useState({});
    const [axes, setAxes] = useState([0, 0, 0, 0]);
    const requestRef = useRef();

    useEffect(() => {
        const handleConnected = (e) => {
            console.log("Gamepad connected:", e.gamepad);
            setGamepad(e.gamepad);
        };

        const handleDisconnected = (e) => {
            console.log("Gamepad disconnected");
            setGamepad(null);
        };

        window.addEventListener("gamepadconnected", handleConnected);
        window.addEventListener("gamepaddisconnected", handleDisconnected);

        const pollGamepad = () => {
            const gamepads = navigator.getGamepads();
            if (gamepads[0]) {
                const gp = gamepads[0];
                
                // Update buttons
                const newButtons = {};
                gp.buttons.forEach((button, index) => {
                    newButtons[index] = button.pressed;
                });
                setButtonStates(newButtons);

                // Update axes
                setAxes([...gp.axes]);
            }
            requestRef.current = requestAnimationFrame(pollGamepad);
        };

        requestRef.current = requestAnimationFrame(pollGamepad);

        return () => {
            window.removeEventListener("gamepadconnected", handleConnected);
            window.removeEventListener("gamepaddisconnected", handleDisconnected);
            cancelAnimationFrame(requestRef.current);
        };
    }, []);

    return { gamepad, buttonStates, axes };
};

export default useGamepad;
