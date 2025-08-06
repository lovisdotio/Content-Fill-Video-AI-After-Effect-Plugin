// CEP Interface
var csInterface = new CSInterface();



// UI Elements
var generateBtn = document.getElementById("generate-btn");
var apiKeyInput = document.getElementById("apiKey");
var promptInput = document.getElementById("prompt");
var negativePromptInput = document.getElementById("negative_prompt");
var resolutionSelect = document.getElementById("resolution");
var inferenceStepsInput = document.getElementById("num_inference_steps");
var statusText = document.getElementById("status-text");
var progressBar = document.getElementById("progress-bar");

// New UI Elements for model selection
var modelSelection = document.getElementById("modelSelection");
var generativeFillOptions = document.getElementById("generative-fill-options");
var videoToVideoOptions = document.getElementById("video-to-video-options");
var videoPromptInput = document.getElementById("videoPrompt");
var strengthInput = document.getElementById("strength");
var numFramesInput = document.getElementById("num_frames");
var framesPerSecondInput = document.getElementById("frames_per_second");

// Event listener for model selection
modelSelection.addEventListener("change", function() {
    if (modelSelection.value === "video-to-video") {
        generativeFillOptions.style.display = "none";
        videoToVideoOptions.style.display = "block";
    } else {
        generativeFillOptions.style.display = "block";
        videoToVideoOptions.style.display = "none";
    }
});

// Helper function to show alerts
function showAlert(message) {
    alert(message);
}

// Helper function to update status
function updateStatus(message) {
    statusText.textContent = "Status: " + message;
    console.log(message);
}

// Helper function to show/hide progress
function showProgress(show, value) {
    if (show) {
        progressBar.style.display = "block";
        progressBar.value = value || 0;
    } else {
        progressBar.style.display = "none";
    }
}

// Main function when generate button is clicked
generateBtn.addEventListener("click", function() {
    generateBtn.disabled = true;
    showProgress(false);

    try {
        var apiKey = apiKeyInput.value;
        if (!apiKey) {
            throw new Error("Please provide your FAL API Key.");
        }

        var selectedModel = modelSelection.value;
        var params = {
            apiKey: apiKey,
            negative_prompt: negativePromptInput.value || "low quality, blur, watermark",
            resolution: resolutionSelect.value,
            num_inference_steps: parseInt(inferenceStepsInput.value, 10) || 30,
        };

        var validationScript;
        if (selectedModel === "video-to-video") {
            params.prompt = videoPromptInput.value || "A low-angle medium shot of a cat...";
            params.strength = parseFloat(strengthInput.value) || 0.9;
            params.num_frames = parseInt(numFramesInput.value, 10) || 81;
            params.frames_per_second = parseInt(framesPerSecondInput.value, 10) || 16;
            validationScript = "validateSelectionForVideo()";
        } else {
            params.prompt = promptInput.value || "A cinematic shot of a boat in the ocean";
            validationScript = "validateSelectionForInpaint()";
        }

        updateStatus("Checking selection...");
        csInterface.evalScript(validationScript, function(result) {
            if (handleError(result)) return;

            var selectionInfo = JSON.parse(result);
            updateStatus("Selection valid: " + selectionInfo.compName);

            if (selectedModel === "video-to-video") {
                startVideoRender(selectionInfo, params);
            } else {
                startInpaintRender(selectionInfo, params);
            }
        });

    } catch (error) {
        console.error("Plugin Error:", error);
        updateStatus("Error!");
        showAlert("Error: " + error.message);
        generateBtn.disabled = false;
    }
});

function handleError(result) {
    if (!result || result.startsWith("ERROR:")) {
        var errorMessage = result ? result.substring(6) : "No response from After Effects.";
        updateStatus("Error: " + errorMessage);
        showAlert(errorMessage);
        generateBtn.disabled = false;
        return true;
    }
    return false;
}

function startInpaintRender(selectionInfo, params) {
    updateStatus("Rendering source and mask videos...");
    showProgress(true, 10);
    var renderFolderName = "temp_fal_renders_" + Date.now();
    var selectionString = JSON.stringify(selectionInfo);

    csInterface.evalScript(
        "renderVideos('" + selectionString + "', '" + renderFolderName + "')",
        function(result) {
            if (handleError(result)) return;
            var renderResult = JSON.parse(result);
            updateStatus("Render complete! Processing with AI...");
            showProgress(true, 30);
            processWithFalAIInpaint(renderResult, params);
        }
    );
}

function startVideoRender(selectionInfo, params) {
    updateStatus("Rendering source video...");
    showProgress(true, 10);
    var renderFolderName = "temp_fal_renders_" + Date.now();
    var selectionString = JSON.stringify(selectionInfo);

    csInterface.evalScript(
        "renderVideoForVideo('" + selectionString + "', '" + renderFolderName + "')",
        function(result) {
            if (handleError(result)) return;
            var renderResult = JSON.parse(result);
            updateStatus("Render complete! Processing with AI...");
            showProgress(true, 30);
            processWithFalAIVideoToVideo(renderResult, params);
        }
    );
}

function processWithFalAIInpaint(renderResult, params) {
    updateStatus("Uploading source video...");
    showProgress(true, 40);

    var sourceVideoPath = renderResult.sourceVideoPath.replace(/\\/g, "/");
    var maskVideoPath = renderResult.maskVideoPath.replace(/\\/g, "/");
    
    var bundledClient = getFalClient();
    if (!bundledClient) return;

    bundledClient.uploadFile(sourceVideoPath, params.apiKey, function(err, sourceUrl) {
        if (err) {
            handleUploadError("Source video upload failed", err);
            return;
        }
        
        updateStatus("Uploading mask video...");
        showProgress(true, 50);
        
        bundledClient.uploadFile(maskVideoPath, params.apiKey, function(err, maskUrl) {
            if (err) {
                handleUploadError("Mask video upload failed", err);
                return;
            }
            
            updateStatus("Submitting AI inpainting job...");
            showProgress(true, 60);

            var jobParams = {
                prompt: params.prompt,
                negative_prompt: params.negative_prompt,
                sourceUrl: sourceUrl,
                maskUrl: maskUrl,
                fps: renderResult.frameRate || 16,
                resolution: params.resolution,
                aspect_ratio: calculateAspectRatio(renderResult),
                num_inference_steps: params.num_inference_steps,
                apiKey: params.apiKey
            };

            bundledClient.submitJob(jobParams, function(err, result) {
                handleJobSubmission(err, result, params.apiKey, renderResult, "fal-ai/wan-vace");
            });
        });
    });
}

function processWithFalAIVideoToVideo(renderResult, params) {
    updateStatus("Uploading source video...");
    showProgress(true, 40);

    var sourceVideoPath = renderResult.sourceVideoPath.replace(/\\/g, "/");

    var bundledClient = getFalClient();
    if (!bundledClient) return;

    bundledClient.uploadFile(sourceVideoPath, params.apiKey, function(err, sourceUrl) {
        if (err) {
            handleUploadError("Source video upload failed", err);
            return;
        }

        updateStatus("Submitting AI video-to-video job...");
        showProgress(true, 60);

        var jobParams = {
            prompt: params.prompt,
            video_url: sourceUrl,
            strength: params.strength,
            num_frames: params.num_frames,
            frames_per_second: params.frames_per_second,
            negative_prompt: params.negative_prompt,
            resolution: params.resolution,
            num_inference_steps: params.num_inference_steps,
            apiKey: params.apiKey
        };
        
        bundledClient.submitVideoToVideoJob(jobParams, function(err, result) {
            handleJobSubmission(err, result, params.apiKey, renderResult, "fal-ai/wan/v2.2-a14b/video-to-video");
        });
    });
}

function getFalClient() {
    var bundledClient = window.FalAIClientBundled && window.FalAIClientBundled.default ? window.FalAIClientBundled.default : window.FalAIClientBundled;
    if (!bundledClient) {
        addDebugLog("ERROR: Official FAL.ai client not loaded");
        updateStatus("Error: FAL.ai client not loaded");
        showAlert("Plugin Error: FAL.ai client not properly loaded. Please restart After Effects.");
        generateBtn.disabled = false;
        showProgress(false);
        return null;
    }
    return bundledClient;
}

function handleUploadError(message, err) {
    addDebugLog(message + ": " + err);
    updateStatus("Upload failed!");
    showAlert("Upload Error: " + err);
    generateBtn.disabled = false;
    showProgress(false);
}

function calculateAspectRatio(renderResult) {
    if (renderResult.compWidth && renderResult.compHeight) {
        var ratio = renderResult.compWidth / renderResult.compHeight;
        if (Math.abs(ratio - (16 / 9)) < 0.05) return "16:9";
        if (Math.abs(ratio - (9 / 16)) < 0.05) return "9:16";
        if (Math.abs(ratio - 1) < 0.05) return "1:1";
    }
    return "16:9"; // Default fallback
}

function handleJobSubmission(err, result, apiKey, renderResult, modelUrl) {
    addDebugLog("Job submission callback received. Error: " + (err ? err.message || err : "none") + ", Result: " + JSON.stringify(result));
    
    if (err) {
        updateStatus("Job submission failed!");
        showAlert("Job Error: " + (err.message || err));
        generateBtn.disabled = false;
        showProgress(false);
        return;
    }

    // Handle nested data object for video-to-video model
    var videoData = result.data ? result.data : result;

    if (videoData && videoData.video && videoData.video.url) {
        downloadAndImportResult(videoData.video.url, renderResult.renderFolder, renderResult);
    } else if (result && result.request_id) {
        pollJobStatus(result.request_id, apiKey, renderResult, modelUrl);
    } else {
        updateStatus("Unexpected API response!");
        showAlert("Unexpected response from FAL.ai: " + JSON.stringify(result));
        generateBtn.disabled = false;
        showProgress(false);
    }
}

function pollJobStatus(requestId, apiKey, renderResult, modelUrl) {
    updateStatus("AI processing in progress...");
    showProgress(true, 70);
    
    var bundledClient = getFalClient();
    
    var pollInterval = setInterval(function() {
        bundledClient.checkJobStatus(requestId, apiKey, modelUrl, function(err, result) {
            addDebugLog("Job status check callback - RequestID: " + requestId);
            
            if (err) {
                clearInterval(pollInterval);
                updateStatus("Status check failed!");
                showAlert("Status Error: " + (err.message || err));
                generateBtn.disabled = false;
                showProgress(false);
                return;
            }
            
            if (result && result.status === 'COMPLETED' && result.video && result.video.url) {
                clearInterval(pollInterval);
                downloadAndImportResult(result.video.url, renderResult.renderFolder, renderResult);
            } else if (result && result.status === 'FAILED') {
                clearInterval(pollInterval);
                updateStatus("AI processing failed!");
                showAlert("AI processing failed: " + (result.error || "Unknown error"));
                generateBtn.disabled = false;
                showProgress(false);
            }
        });
    }, 5000); // Poll every 5 seconds
}

function downloadAndImportResult(videoUrl, renderFolder, renderResult) {
    addDebugLog("Starting download and import process");
    addDebugLog("Video URL: " + videoUrl);
    addDebugLog("Render folder: " + renderFolder);
    
    updateStatus("Downloading result...");
    showProgress(true, 85);
    
    var outputPath = renderFolder + "/fal_inpainted_result.mp4";
    addDebugLog("Output path: " + outputPath);
    
    // Use official FAL.ai client for download
    var bundledClient = window.FalAIClientBundled && window.FalAIClientBundled.default ? window.FalAIClientBundled.default : window.FalAIClientBundled;
    
    if (!bundledClient) {
        addDebugLog("ERROR: Bundled client not available for download");
        updateStatus("Download failed!");
        showAlert("Download Error: FAL.ai client not available");
        generateBtn.disabled = false;
        showProgress(false);
        return;
    }
    
    addDebugLog("Starting download with bundled client...");
    bundledClient.downloadFile(videoUrl, outputPath, function(err) {
        addDebugLog("Download callback received");
        addDebugLog("Download error: " + (err || "none"));
        
        if (err) {
            addDebugLog("Download failed: " + err);
            updateStatus("Download failed!");
            
            // Show custom modal with download link
            showFallbackModal(videoUrl);
            
            generateBtn.disabled = false;
            showProgress(false);
            return;
        }
        
        addDebugLog("Download successful, starting import...");
        updateStatus("Importing into After Effects...");
        showProgress(true, 95);
        
        // Pass the original renderResult (which includes comp info) to the import script
        var selectionString = JSON.stringify(renderResult);
        var importScript = "importVideoFile('" + outputPath + "', '" + selectionString + "')";
        addDebugLog("Calling ExtendScript: " + importScript);
        
        csInterface.evalScript(importScript, function(result) {
            addDebugLog("Import ExtendScript result: " + result);
            
            if (result.startsWith("ERROR:")) {
                addDebugLog("Import failed: " + result.substring(6));
                updateStatus("Import failed!");
                showAlert("Import Error: " + result.substring(6));
                generateBtn.disabled = false;
                showProgress(false);
                return;
            }
            
            addDebugLog("Import successful!");
            updateStatus("Process complete!");
            showProgress(false);
            generateBtn.disabled = false;
            showAlert("Generative Fill Video completed successfully! Check your project panel for the result.");
        });
    });
}

// Check if After Effects is available and update status
function checkAfterEffectsStatus() {
    csInterface.evalScript("getAEInfo()", function(result) {
        if (result.startsWith("ERROR:")) {
            updateStatus("After Effects not available");
        } else {
            var aeInfo = JSON.parse(result);
            updateStatus("Connected to " + aeInfo.appName + " - Ready to use");
            
            // Check current selection
            checkCurrentSelection();
        }
    });
}

function checkCurrentSelection() {
    var validationScript = modelSelection.value === 'video-to-video' 
        ? "validateSelectionForVideo()" 
        : "validateSelectionForInpaint()";

    csInterface.evalScript(validationScript, function(result) {
        if (result.startsWith("ERROR:")) {
            var error = result.substring(6);
            if (error.includes("select a composition")) {
                updateStatus("Please open a composition in After Effects");
            } else if (error.includes("select exactly one layer")) {
                updateStatus("Please select exactly one layer");
            } else if (error.includes("no masks") && modelSelection.value === 'generative-fill') {
                updateStatus("Please add a mask to the selected layer for inpainting");
            } else {
                updateStatus("Ready");
            }
        } else {
            var selectionInfo = JSON.parse(result);
            updateStatus("Ready! Layer '" + selectionInfo.layerName + "' selected");
        }
    });
}

// Remove the separate check selection button - it's now integrated in the Generate button

// Initialize plugin
csInterface.addEventListener("com.adobe.AfterEffects", function(event) {
    console.log("After Effects event:", event);
    checkCurrentSelection();
});

// Debug logging functions
var debugLogs = [];
function addDebugLog(message) {
    var timestamp = new Date().toLocaleTimeString();
    var logMessage = "[" + timestamp + "] " + message;
    debugLogs.push(logMessage);
    console.log("DEBUG:", message);
    
    // Update debug logs display
    var logContent = document.getElementById("log-content");
    if (logContent) {
        logContent.textContent = debugLogs.join("\n");
        logContent.scrollTop = logContent.scrollHeight;
    }
}

// Debug console function
function openDebugConsole() {
    addDebugLog("=== DEBUG CONSOLE OPENED ===");
    addDebugLog("Plugin path: " + csInterface.getSystemPath(SystemPath.EXTENSION));
    addDebugLog("Ready to show debug messages...");
    
    // Show the debug logs section
    var debugSection = document.getElementById("debug-logs");
    if (debugSection) {
        debugSection.style.display = "block";
    }
    
    // Show alert with instructions
    showAlert("Debug Console Activated!\n\n" +
              "Debug logs will now appear directly in the plugin below.\n" +
              "Click Generate to see what happens step by step.\n\n" +
              "For advanced debugging, you can also:\n" +
              "• Right-click in this panel → 'Inspect Element'\n" +
              "• Go to Console tab for more detailed logs");
}

// Fallback Modal Functions
function showFallbackModal(videoUrl) {
    var modal = document.getElementById("fallback-modal");
    var urlInput = document.getElementById("fallback-url");
    var link = document.getElementById("fallback-link");
    
    urlInput.value = videoUrl;
    link.href = videoUrl;
    
    modal.style.display = "flex";
}

function hideFallbackModal() {
    var modal = document.getElementById("fallback-modal");
    modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function() {
    var modal = document.getElementById("fallback-modal");
    var closeBtn = document.querySelector(".modal-close-btn");
    var copyBtn = document.getElementById("copy-url-btn");
    var urlInput = document.getElementById("fallback-url");

    if (closeBtn) {
        closeBtn.addEventListener("click", hideFallbackModal);
    }
    
    if (copyBtn) {
        copyBtn.addEventListener("click", function() {
            urlInput.select();
            document.execCommand("copy");
            updateStatus("URL copied to clipboard!");
        });
    }

    if (modal) {
        modal.addEventListener("click", function(event) {
            if (event.target === modal) {
                hideFallbackModal();
            }
        });
    }
});

console.log("Generative Fill Video Plugin by Lovis Odin - Initialized");
setTimeout(function() {
    checkAfterEffectsStatus();
    // No separate check button anymore - checking is integrated in Generate
}, 1000);
