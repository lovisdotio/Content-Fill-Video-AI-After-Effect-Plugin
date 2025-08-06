import { fal } from '@fal-ai/client';

// Configure the client to work in CEP environment
const FalAIClientBundled = {
    
    /**
     * Configure FAL.ai client with API key
     */
    configure: function(apiKey) {
        fal.config({
            credentials: apiKey
        });
    },
    
    /**
     * Upload file to FAL.ai storage using official client
     */
    uploadFile: function(filePath, apiKey, callback) {
        console.log('DEBUG: Using official FAL.ai storage upload for:', filePath);
        
        // Configure the client
        this.configure(apiKey);
        
        // Read file from path (for CEP environment)
        fetch('file://' + filePath)
            .then(response => response.blob())
            .then(blob => {
                // Create File object
                const fileName = filePath.split('/').pop() || filePath.split('\\').pop();
                const file = new File([blob], fileName, { type: blob.type || 'video/mp4' });
                
                console.log('DEBUG: Uploading file via fal.storage.upload:', file.name, 'Size:', file.size);
                
                // Use official FAL.ai storage upload
                return fal.storage.upload(file);
            })
            .then(url => {
                console.log('DEBUG: Official upload successful:', url);
                callback(null, url);
            })
            .catch(error => {
                console.log('DEBUG: Official upload failed:', error.message);
                callback(error.message);
            });
    },
    
    /**
     * Submit job to FAL.ai wan-vace model using official client (cheaper than wan-vace-14b)
     */
    submitJob: function(params, callback) {
        console.log('DEBUG: Submitting job to wan-vace via official client');
        
        // Configure the client
        this.configure(params.apiKey);
        
        // Submit job using official client with simplified wan-vace parameters
        const inputData = {
            prompt: params.prompt
        };
        
        // Add optional parameters only if they exist
        if (params.sourceUrl) {
            inputData.video_url = params.sourceUrl;
        }
        if (params.maskUrl) {
            inputData.mask_video_url = params.maskUrl;
        }
        if (params.negative_prompt) {
            inputData.negative_prompt = params.negative_prompt;
        }
        
        // Add core parameters with defaults
        inputData.task = "inpainting";
        inputData.num_frames = 81;
        inputData.frames_per_second = Math.min(Math.max(params.fps || 16, 5), 24); // Clamp between 5-24
        inputData.resolution = params.resolution || "720p";
        inputData.aspect_ratio = params.aspect_ratio || "16:9";
        inputData.num_inference_steps = params.num_inference_steps || 30;
        inputData.shift = 5;
        inputData.enable_safety_checker = true;
        inputData.enable_prompt_expansion = true;
        
        console.log('DEBUG: Sending wan-vace request with input:', JSON.stringify(inputData));
        
        fal.subscribe("fal-ai/wan-vace", {
            input: inputData,
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    console.log('DEBUG: Job in progress:', update.logs?.map(log => log.message).join(', '));
                }
            }
        })
        .then(result => {
            console.log('DEBUG: Job completed successfully:', result.data);
            console.log('DEBUG: Result video URL:', result.data?.video?.url);
            callback(null, result.data);
        })
        .catch(error => {
            console.log('DEBUG: Job submission failed:', error.message);
            console.log('DEBUG: Full error:', error);
            callback(error);
        });
    },

    submitVideoToVideoJob: function(params, callback) {
        console.log('DEBUG: Submitting job to wan-vace-2-video-to-video via official client');
        
        this.configure(params.apiKey);
        
        const inputData = {
            prompt: params.prompt,
            video_url: params.video_url,
            strength: params.strength,
            num_frames: params.num_frames,
            frames_per_second: params.frames_per_second,
            negative_prompt: params.negative_prompt,
            resolution: params.resolution,
            num_inference_steps: params.num_inference_steps,
        };
        
        console.log('DEBUG: Sending video-to-video request with input:', JSON.stringify(inputData));
        
        fal.subscribe("fal-ai/wan/v2.2-a14b/video-to-video", {
            input: inputData,
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    console.log('DEBUG: Job in progress:', update.logs?.map(log => log.message).join(', '));
                }
            }
        })
        .then(result => {
            console.log('DEBUG: Job completed successfully:', result);
            callback(null, result);
        })
        .catch(error => {
            console.log('DEBUG: Job submission failed:', error.message);
            callback(error);
        });
    },
    
    /**
     * Check job status using official client
     */
    checkJobStatus: function(requestId, apiKey, modelUrl, callback) {
        console.log('DEBUG: Checking job status via official client:', requestId, 'for model:', modelUrl);
        
        // Configure the client
        this.configure(apiKey);
        
        // Check status using official client
        fal.queue.status(modelUrl, {
            requestId: requestId,
            logs: true
        })
        .then(status => {
            console.log('DEBUG: Job status:', status);
            callback(null, status);
        })
        .catch(error => {
            console.log('DEBUG: Status check failed:', error.message);
            callback(error);
        });
    },
    
    /**
     * Download file from URL using modern fetch API
     */
    downloadFile: function(url, outputPath, callback) {
        console.log('DEBUG: Starting download from:', url);
        console.log('DEBUG: Download target path:', outputPath);
        
        fetch(url)
            .then(response => {
                console.log('DEBUG: Fetch response status:', response.status);
                console.log('DEBUG: Fetch response headers:', response.headers);
                
                if (!response.ok) {
                    throw new Error('Download failed with status: ' + response.status);
                }
                return response.blob();
            })
            .then(blob => {
                console.log('DEBUG: Blob received, size:', blob.size, 'type:', blob.type);
                console.log('DEBUG: Downloading file directly without base64 conversion...');
                
                // Use direct file download via ExtendScript instead of base64 conversion
                const script = `saveFileFromUrl("${url}", "${outputPath}")`;
                console.log('DEBUG: Calling ExtendScript saveFileFromUrl...');
                
                if (typeof csInterface !== 'undefined') {
                    csInterface.evalScript(script, function(result) {
                        console.log('DEBUG: ExtendScript result:', result);
                        
                        if (result.startsWith('ERROR:')) {
                            callback(result.substring(6));
                        } else {
                            console.log('DEBUG: File downloaded and saved successfully');
                            callback(null);
                        }
                    });
                } else {
                    console.log('DEBUG: ERROR - CEP interface not available');
                    callback('CEP interface not available');
                }
            })
            .catch(error => {
                console.log('DEBUG: Download fetch failed:', error.message);
                console.log('DEBUG: Full download error:', error);
                callback(error.message);
            });
    }
};

// Export for webpack
export default FalAIClientBundled;