import { useEffect, useRef, useState } from 'react';

export const useSpotifyPlayer = () => {
  const playerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [playerError, setPlayerError] = useState(null);
  const [token, setToken] = useState(null);

  // Get token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  useEffect(() => {
    if (!token || !window.Spotify) {
      return;
    }

    // Define global callback for Spotify SDK
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Music App Web Player',
        getOAuthToken: (callback) => {
          callback(token);
        },
        volume: 0.5
      });

      // Ready
      player.addListener('player_state_changed', (state) => {
        console.log('Player state changed:', state);
      });

      // Not Ready
      player.addListener('initialization_error', ({ message }) => {
        console.error('Initialization error:', message);
        setPlayerError(message);
      });

      // Authentication error
      player.addListener('authentication_error', ({ message }) => {
        console.error('Authentication error:', message);
        setPlayerError(message);
      });

      // Account error
      player.addListener('account_error', ({ message }) => {
        console.error('Account error:', message);
        setPlayerError(message);
      });

      // Playback error
      player.addListener('playback_error', ({ message }) => {
        console.error('Playback error:', message);
        setPlayerError(message);
      });

      // Successful connection
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID:', device_id);
        setDeviceId(device_id);
        setPlayerReady(true);
      });

      // Disconnected
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline:', device_id);
        setPlayerReady(false);
      });

      // Connect to the player
      player.connect().then((success) => {
        if (success) {
          console.log('Spotify Player connected successfully');
        } else {
          console.log('Failed to connect Spotify Player');
          setPlayerError('Failed to connect Spotify Player');
        }
      });

      playerRef.current = player;
    };

    // Trigger SDK ready callback if SDK already loaded
    if (window.Spotify && window.Spotify.Player) {
      window.onSpotifyWebPlaybackSDKReady();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, [token]);

  const play = async (spotifyUri) => {
    if (!playerReady || !deviceId) {
      console.warn('Player not ready or no device ID');
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: [spotifyUri]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error playing track:', error);
      setPlayerError(error.message);
      return false;
    }
  };

  const pause = async () => {
    if (!playerReady || !deviceId) {
      console.warn('Player not ready or no device ID');
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error pausing:', error);
      setPlayerError(error.message);
      return false;
    }
  };

  const resume = async () => {
    if (!playerReady || !deviceId) {
      console.warn('Player not ready or no device ID');
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error resuming:', error);
      setPlayerError(error.message);
      return false;
    }
  };

  const next = async () => {
    if (!playerReady || !deviceId) {
      console.warn('Player not ready or no device ID');
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/next?device_id=${deviceId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error skipping to next:', error);
      setPlayerError(error.message);
      return false;
    }
  };

  const previous = async () => {
    if (!playerReady || !deviceId) {
      console.warn('Player not ready or no device ID');
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error skipping to previous:', error);
      setPlayerError(error.message);
      return false;
    }
  };

  const seek = async (positionMs) => {
    if (!playerReady || !deviceId) {
      console.warn('Player not ready or no device ID');
      return false;
    }

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${positionMs}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error seeking:', error);
      setPlayerError(error.message);
      return false;
    }
  };

  return {
    playerReady,
    deviceId,
    playerError,
    play,
    pause,
    resume,
    next,
    previous,
    seek
  };
};
