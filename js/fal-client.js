// FAL.ai API Integration for CEP
// This module handles all API calls to fal.ai

var FalAIClient = (function() {
    
    // Use CEP-compatible file system access
    var cep = window.__adobe_cep__;
    var csInterface = new CSInterface();
    
    /**
     * Upload a file to FAL.ai storage using automatic file reading
     */
    function uploadFile(filePath, apiKey, callback) {
        console.log('DEBUG: Starting upload for file:', filePath);
        console.log('DEBUG: API key provided:', !!apiKey);
        
        // Use ExtendScript to read the file as base64 then convert back to file
        csInterface.evalScript('readFileAsBase64("' + filePath + '")', function(base64Data) {
            console.log('DEBUG: ExtendScript response received');
            
            if (!base64Data || base64Data.startsWith('ERROR:')) {
                console.log('DEBUG: Failed to read file:', base64Data);
                
                // Fallback to manual file selection
                uploadFileManually(filePath, apiKey, callback);
                return;
            }
            
            try {
                console.log('DEBUG: Converting base64 to file object');
                
                // Convert base64 to Blob
                var binaryString = atob(base64Data);
                var bytes = new Uint8Array(binaryString.length);
                for (var i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                var fileName = filePath.split('/').pop().split('\\').pop();
                var blob = new Blob([bytes], { type: 'video/mp4' });
                var file = new File([blob], fileName, { type: 'video/mp4' });
                
                console.log('DEBUG: File object created:', file.name, 'Size:', file.size);
                
                // Convert to Base64 data URI instead of uploading
                fileToBase64DataUri(file, callback);
                
            } catch (error) {
                console.log('DEBUG: Error processing file:', error.message);
                // Fallback to manual selection
                processFileManually(filePath, apiKey, callback);
            }
        });
    }
    
    /**
     * Convert file to Base64 data URI (no upload needed)
     */
    function fileToBase64DataUri(file, callback) {
        console.log('DEBUG: Converting file to Base64 data URI:', file.name, 'Size:', file.size);
        
        var reader = new FileReader();
        
        reader.onload = function(e) {
            var dataUri = e.target.result;
            console.log('DEBUG: File converted to Base64 successfully');
            callback(null, dataUri);
        };
        
        reader.onerror = function(e) {
            console.log('DEBUG: Error converting file to Base64:', e);
            callback('Failed to convert file to Base64');
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * Fallback manual file selection
     */
    function processFileManually(filePath, apiKey, callback) {
        console.log('DEBUG: Using manual file selection fallback');
        
        var fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'video/*';
        fileInput.style.display = 'none';
        
        var fileName = filePath.split('/').pop().split('\\').pop();
        
        fileInput.onchange = function(event) {
            var file = event.target.files[0];
            if (!file) {
                callback('No file selected');
                return;
            }
            
            console.log('DEBUG: Manual file selected:', file.name, 'Size:', file.size);
            fileToBase64DataUri(file, callback);
        };
        
        alert('Please select the ' + fileName + ' file from:\n' + filePath.substring(0, filePath.lastIndexOf('/')));
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    }
    
    /**
     * Submit a job to FAL.ai wan-vace-14b model using XMLHttpRequest
     */
    function submitJob(params, callback) {
        var data = JSON.stringify({
            prompt: params.prompt,
            video_url: params.sourceUrl // Base64 data URI for source video
            // wan-vace-14b only requires prompt and video_url according to documentation
        });
        
        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://fal.run/fal-ai/wan-vace-14b', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', 'Key ' + params.apiKey);
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var result = JSON.parse(xhr.responseText);
                    callback(null, result);
                } catch (e) {
                    callback(new Error('Failed to parse job response: ' + e.message));
                }
            } else {
                callback(new Error('Job submission failed with status: ' + xhr.status + ' - ' + xhr.responseText));
            }
        };
        
        xhr.onerror = function() {
            callback(new Error('Job submission request failed'));
        };
        
        xhr.send(data);
    }
    
    /**
     * Check job status using XMLHttpRequest
     */
    function checkJobStatus(requestId, apiKey, callback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://fal.run/fal-ai/wan-vace-14b/requests/' + requestId, true);
        xhr.setRequestHeader('Authorization', 'Key ' + apiKey);
        
        xhr.onload = function() {
            if (xhr.status === 200) {
                try {
                    var result = JSON.parse(xhr.responseText);
                    callback(null, result);
                } catch (e) {
                    callback(new Error('Failed to parse status response: ' + e.message));
                }
            } else {
                callback(new Error('Status check failed with status: ' + xhr.status));
            }
        };
        
        xhr.onerror = function() {
            callback(new Error('Status check request failed'));
        };
        
        xhr.send();
    }
    
    /**
     * Download a file from URL - simplified approach for CEP
     */
    function downloadFile(url, outputPath, callback) {
        // For CEP, we'll use a simpler approach
        // Create a link element to trigger download, then let user manually save
        try {
            var link = document.createElement('a');
            link.href = url;
            link.download = outputPath.split('/').pop().split('\\').pop();
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Return success immediately since the download was triggered
            callback(null);
            
        } catch (error) {
            callback(error);
        }
    }
    
    // Public API
    return {
        uploadFile: uploadFile,
        submitJob: submitJob,
        checkJobStatus: checkJobStatus,
        downloadFile: downloadFile
    };
})();

// Make it available globally in CEP context
if (typeof window !== 'undefined') {
    window.FalAIClient = FalAIClient;
}