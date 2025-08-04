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
        // Get user inputs
        var apiKey = apiKeyInput.value;
        if (!apiKey) {
            throw new Error("Please provide your FAL API Key.");
        }
        
        var params = {
            prompt: promptInput.value || "A cinematic shot of a boat in the ocean",
            negative_prompt: negativePromptInput.value || "low quality, blur, watermark",
            resolution: resolutionSelect.value,
            num_inference_steps: parseInt(inferenceStepsInput.value, 10) || 30,
            apiKey: apiKey
        };
        
        updateStatus("Checking selection...");
        addDebugLog("Starting selection validation...");
        
        // Call ExtendScript to validate selection
        csInterface.evalScript("validateSelection()", function(result) {
            addDebugLog("validateSelection() returned: " + result);
            
            if (!result) {
                addDebugLog("ERROR: No result returned from ExtendScript!");
                throw new Error("No response from After Effects. Please try again.");
            }
            
            if (result.startsWith("ERROR:")) {
                var error = result.substring(6);
                addDebugLog("ExtendScript error: " + error);
                if (error.includes("select a composition")) {
                    throw new Error("Please open a composition in After Effects");
                } else if (error.includes("select exactly one layer")) {
                    throw new Error("Please select exactly one layer");
                } else if (error.includes("no masks")) {
                    throw new Error("Please add a mask to the selected layer");
                } else {
                    throw new Error(error);
                }
            }
            
            addDebugLog("Parsing selection info...");
            var selectionInfo = JSON.parse(result);
            addDebugLog("Selection info parsed: " + JSON.stringify(selectionInfo));
            updateStatus("Selection valid: " + selectionInfo.compName);
            
            // Start the rendering process
            startRendering(selectionInfo, params);
        });
        
    } catch (error) {
        console.error("Plugin Error:", error);
        updateStatus("Error!");
        showAlert("Error: " + error.message);
        generateBtn.disabled = false;
    }
});

function startRendering(selectionInfo, params) {
    addDebugLog("Starting render process...");
    updateStatus("Rendering source and mask videos...");
    showProgress(true, 10);
    
    var renderFolderName = "temp_fal_renders_" + Date.now();
    var paramsString = JSON.stringify(params);
    var selectionString = JSON.stringify(selectionInfo);
    
    addDebugLog("Render folder: " + renderFolderName);
    addDebugLog("Calling renderVideos() ExtendScript function...");
    
    // Call ExtendScript to render videos
    csInterface.evalScript(
        "renderVideos('" + selectionString + "', '" + renderFolderName + "')", 
        function(result) {
            addDebugLog("renderVideos() returned: " + result);
            
            if (result.startsWith("ERROR:")) {
                addDebugLog("Render error: " + result.substring(6));
                updateStatus("Render failed!");
                showAlert("Render Error: " + result.substring(6));
                generateBtn.disabled = false;
                showProgress(false);
                return;
            }
            
            addDebugLog("Parsing render result JSON...");
            try {
                var renderResult = JSON.parse(result);
                addDebugLog("Render result parsed successfully: " + JSON.stringify(renderResult));
                updateStatus("Render complete! Processing with AI...");
                showProgress(true, 30);
                
                // Start FAL.ai processing
                addDebugLog("Starting FAL.ai processing...");
                processWithFalAI(renderResult, params);
            } catch (jsonError) {
                addDebugLog("JSON parse error: " + jsonError.message);
                addDebugLog("Raw result was: " + result);
                updateStatus("JSON Parse Error!");
                showAlert("Error parsing render result: " + jsonError.message + "\n\nRaw result: " + result);
                generateBtn.disabled = false;
                showProgress(false);
                return;
            }
        }
    );
}

function processWithFalAI(renderResult, params) {
    updateStatus("Preparing to upload source video...");
    showProgress(true, 40);
    
    addDebugLog("About to convert source video: " + renderResult.sourceVideoPath);
    addDebugLog("API Key length: " + params.apiKey.length);
    
    // Use official FAL.ai client only (no fallback)
    var bundledClient = window.FalAIClientBundled && window.FalAIClientBundled.default ? window.FalAIClientBundled.default : window.FalAIClientBundled;
    
    if (!bundledClient) {
        addDebugLog("ERROR: Official FAL.ai client not loaded");
        updateStatus("Error: FAL.ai client not loaded");
        showAlert("Plugin Error: FAL.ai client not properly loaded. Please restart After Effects.");
        generateBtn.disabled = false;
        showProgress(false);
        return;
    }
    
    addDebugLog("Using official FAL.ai client for upload");
    addDebugLog("Client loaded successfully with uploadFile available");
    updateStatus("Uploading source video to FAL.ai...");
    
    bundledClient.uploadFile(renderResult.sourceVideoPath, params.apiKey, function(err, sourceUrl) {
        addDebugLog("Upload callback called via official FAL.ai client");
        if (err) {
            addDebugLog("Upload error: " + err);
            updateStatus("Upload failed!");
            showAlert("Upload Error: " + err);
            generateBtn.disabled = false;
            showProgress(false);
            return;
        }
        
        addDebugLog("Source video uploaded successfully: " + sourceUrl);
        
        updateStatus("Uploading mask video to FAL.ai...");
        showProgress(true, 50);
        
        // Upload mask video (wan-vace needs both source and mask)
        bundledClient.uploadFile(renderResult.maskVideoPath, params.apiKey, function(err, maskUrl) {
            if (err) {
                addDebugLog("Mask upload error: " + err);
                updateStatus("Mask upload failed!");
                showAlert("Mask Upload Error: " + err);
                generateBtn.disabled = false;
                showProgress(false);
                return;
            }
            
            addDebugLog("Mask video uploaded successfully: " + maskUrl);
            
            updateStatus("Submitting AI inpainting job... (This may take 2-3 minutes per 81 frames)");
            showProgress(true, 60);
            
            // Submit job to FAL.ai (wan-vace needs both source and mask videos)
            var jobParams = {
                prompt: params.prompt,
                negative_prompt: params.negative_prompt,
                sourceUrl: sourceUrl, // URL from upload
                maskUrl: maskUrl, // Mask video URL
                fps: renderResult.frameRate || 16, // Use source video FPS
                resolution: params.resolution,
                aspect_ratio: params.aspect_ratio,
                num_inference_steps: params.num_inference_steps,
                apiKey: params.apiKey
            };
        
        bundledClient.submitJob(jobParams, function(err, result) {
            addDebugLog("Job submission callback received");
            addDebugLog("Error: " + (err ? err.message || err : "none"));
            addDebugLog("Result: " + JSON.stringify(result));
            
            if (err) {
                addDebugLog("Job submission failed: " + (err.message || err));
                updateStatus("Job submission failed!");
                showAlert("Job Error: " + (err.message || err));
                generateBtn.disabled = false;
                showProgress(false);
                return;
            }
            
            if (result && result.video && result.video.url) {
                addDebugLog("Synchronous job completed, video URL: " + result.video.url);
                // Synchronous job - result ready immediately
                downloadAndImportResult(result.video.url, renderResult.renderFolder);
            } else if (result && result.request_id) {
                addDebugLog("Asynchronous job started, request ID: " + result.request_id);
                // Asynchronous job - need to poll for completion
                pollJobStatus(result.request_id, params.apiKey, renderResult.renderFolder);
            } else {
                addDebugLog("Unexpected response format: " + JSON.stringify(result));
                updateStatus("Unexpected API response!");
                showAlert("Unexpected response from FAL.ai: " + JSON.stringify(result));
                generateBtn.disabled = false;
                showProgress(false);
            }
        });
        });
    });
}

function pollJobStatus(requestId, apiKey, renderFolder) {
    updateStatus("AI processing in progress...");
    showProgress(true, 70);
    
    // Use official FAL.ai client only
    var bundledClient = window.FalAIClientBundled && window.FalAIClientBundled.default ? window.FalAIClientBundled.default : window.FalAIClientBundled;
    
    var pollInterval = setInterval(function() {
        bundledClient.checkJobStatus(requestId, apiKey, function(err, result) {
            addDebugLog("Job status check callback - RequestID: " + requestId);
            addDebugLog("Status check error: " + (err ? err.message || err : "none"));
            addDebugLog("Status result: " + JSON.stringify(result));
            
            if (err) {
                addDebugLog("Status check failed: " + (err.message || err));
                clearInterval(pollInterval);
                updateStatus("Status check failed!");
                showAlert("Status Error: " + (err.message || err));
                generateBtn.disabled = false;
                showProgress(false);
                return;
            }
            
            if (result && result.status === 'COMPLETED' && result.video && result.video.url) {
                addDebugLog("Job completed! Video URL: " + result.video.url);
                clearInterval(pollInterval);
                downloadAndImportResult(result.video.url, renderFolder);
            } else if (result && result.status === 'FAILED') {
                addDebugLog("Job failed: " + (result.error || 'Unknown error'));
                clearInterval(pollInterval);
                updateStatus("AI processing failed!");
                showAlert("AI processing failed: " + (result.error || "Unknown error"));
                generateBtn.disabled = false;
                showProgress(false);
            } else {
                addDebugLog("Job still in progress, status: " + (result ? result.status : 'unknown'));
                // Continue polling for IN_PROGRESS status
            }
        });
    }, 5000); // Poll every 5 seconds
}

function downloadAndImportResult(videoUrl, renderFolder) {
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
        
        // Import the result into After Effects
        var importScript = "importVideoFile('" + outputPath + "')";
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
    csInterface.evalScript("validateSelection()", function(result) {
        if (result.startsWith("ERROR:")) {
            var error = result.substring(6);
            if (error.includes("select a composition")) {
                updateStatus("Please open a composition in After Effects");
            } else if (error.includes("select exactly one layer")) {
                updateStatus("Please select exactly one layer");
            } else if (error.includes("no masks")) {
                updateStatus("Please add a mask to the selected layer");
            } else {
                updateStatus("Selection issue: " + error);
            }
        } else {
            var selectionInfo = JSON.parse(result);
            updateStatus("Ready! Layer '" + selectionInfo.layerName + "' with mask selected");
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
