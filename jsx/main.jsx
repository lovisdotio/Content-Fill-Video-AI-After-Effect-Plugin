// Generative Fill Video - ExtendScript for After Effects
// Created by Lovis Odin - This script handles all After Effects operations

/**
 * Validates the current selection in After Effects
 * Returns JSON string with selection info or error
 */
function validateSelection() {
    try {
        app.beginUndoGroup("Validate Selection");
        
        // Debug: Log start of validation
        $.writeln("DEBUG JSX: Starting validateSelection()");
        
        var comp = app.project.activeItem;
        $.writeln("DEBUG JSX: Active item type: " + (comp ? comp.typeName : "null"));
        
        if (!(comp instanceof CompItem)) {
            $.writeln("DEBUG JSX: No active composition");
            throw new Error("Please select a composition.");
        }
        
        $.writeln("DEBUG JSX: Active comp found: " + comp.name);
        
        var selectedLayers = comp.selectedLayers;
        $.writeln("DEBUG JSX: Number of selected layers: " + selectedLayers.length);
        
        if (selectedLayers.length !== 1) {
            throw new Error("Please select exactly one layer.");
        }
        
        var layer = selectedLayers[0];
        $.writeln("DEBUG JSX: Selected layer: " + layer.name);
        
        var maskPropertyGroup = layer.property("ADBE Mask Parade");
        var maskCount = maskPropertyGroup.numProperties;
        $.writeln("DEBUG JSX: Number of masks: " + maskCount);
        
        if (maskCount === 0) {
            throw new Error("The selected layer has no masks.");
        }
        
        $.writeln("DEBUG JSX: Validation successful");
        app.endUndoGroup();
        
            var selectionInfo = {
        compName: comp.name,
        layerName: layer.name,
        compId: comp.id,
        layerId: layer.id,
        compWidth: comp.width,
        compHeight: comp.height,
        compDuration: comp.duration,
        frameRate: comp.frameRate
    };
    
    // ExtendScript doesn't have JSON.stringify, so we build the string manually
    return '{"compName":"' + comp.name + '","layerName":"' + layer.name + '","compId":' + comp.id + ',"layerId":' + layer.id + ',"compWidth":' + comp.width + ',"compHeight":' + comp.height + ',"compDuration":' + comp.duration + ',"frameRate":' + comp.frameRate + '}';
        
    } catch (error) {
        app.endUndoGroup();
        return "ERROR:" + error.toString();
    }
}

/**
 * Renders the source video and mask video
 * Returns JSON string with file paths or error
 */
function renderVideos(selectionInfoString, renderFolderName) {
    try {
        app.beginUndoGroup("Generative Fill Video Render");
        
        // Parse JSON manually since ExtendScript doesn't have JSON.parse
        var selectionInfo = eval('(' + selectionInfoString + ')');
        
        // Find the composition by ID
        var originalComp = null;
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i) instanceof CompItem && app.project.item(i).id === selectionInfo.compId) {
                originalComp = app.project.item(i);
                break;
            }
        }
        
        if (!originalComp) {
            throw new Error("Could not find the original composition.");
        }
        
        // Create render folder
        var projectFolder = app.project.file.parent;
        var renderFolder = new Folder(projectFolder.fsName + "/" + renderFolderName);
        if (!renderFolder.exists) {
            renderFolder.create();
        }
        
        // Use .mp4 extension for H.264 format
        var sourcePath = new File(renderFolder.fsName + "/source.mp4");
        var maskPath = new File(renderFolder.fsName + "/mask.mp4");
        
        $.writeln("DEBUG JSX: Render folder created: " + renderFolder.fsName);
        
        // Find the original layer in the current composition
        var originalLayer = null;
        for (var i = 1; i <= originalComp.numLayers; i++) {
            if (originalComp.layer(i).name === selectionInfo.layerName) {
                originalLayer = originalComp.layer(i);
                break;
            }
        }
        
        if (!originalLayer) {
            throw new Error("Could not find the layer: " + selectionInfo.layerName);
        }
        
        // Store original mask modes
        var maskModes = [];
        var masks = originalLayer.property("ADBE Mask Parade");
        for (var m = 1; m <= masks.numProperties; m++) {
            maskModes.push(masks.property(m).maskMode);
        }
        
        $.writeln("DEBUG JSX: Rendering SOURCE (with white underlay for mask area)...");

        // STEP 1: Render SOURCE with a white background visible through the mask
        var whiteUnderlay = originalComp.layers.addSolid([1, 1, 1], "Temp_White_Underlay", originalComp.width, originalComp.height, 1, originalComp.duration);
        whiteUnderlay.moveAfter(originalLayer); // Move under the video layer

        // Set masks to Subtract to punch a hole in the video layer
        for (var m = 1; m <= masks.numProperties; m++) {
            masks.property(m).maskMode = MaskMode.SUBTRACT;
        }
        
        var renderQueue = app.project.renderQueue;
        var sourceItem = renderQueue.items.add(originalComp);
        
        // Configure SOURCE output
        try {
            sourceItem.outputModule(1).applyTemplate("H.264 - Match Render Settings - 15 Mbps");
            $.writeln("DEBUG JSX: Using H.264 15 Mbps preset for source");
        } catch (templateError) {
            try {
                sourceItem.outputModule(1).applyTemplate("H.264");
                $.writeln("DEBUG JSX: Using generic H.264 preset for source");
            } catch (templateError2) {
                sourceItem.outputModule(1).format = "H.264";
                $.writeln("DEBUG JSX: Using default H.264 format for source");
            }
        }
        
        sourceItem.outputModule(1).file = sourcePath;
        $.writeln("DEBUG JSX: Rendering SOURCE...");
        renderQueue.render(); 
        
        // Wait for render to complete by checking the render queue status
        while (renderQueue.rendering) {
            $.sleep(100); // Wait 100ms before checking again
        }
        $.writeln("DEBUG JSX: Source render queue finished.");
        
        // Clean up source render
        sourceItem.remove();

        // Restore original mask modes and remove the white underlay
        if (whiteUnderlay) {
            whiteUnderlay.remove();
        }
        for (var m = 1; m <= masks.numProperties; m++) {
            masks.property(m).maskMode = maskModes[m-1]; // Restore original mode
        }
        
        $.writeln("DEBUG JSX: Rendering MASK (with levels effect)...");
        
        // STEP 2: Render MASK - create black and white layers for the mask
        // Create a black solid background
        var blackLayer = originalComp.layers.addSolid([0, 0, 0], "Temp_Black_BG", originalComp.width, originalComp.height, 1, originalComp.duration);
        blackLayer.moveToEnd(); // Move to bottom
        
        // Create a white solid that will be masked
        var whiteLayer = originalComp.layers.addSolid([1, 1, 1], "Temp_White_FG", originalComp.width, originalComp.height, 1, originalComp.duration);
        
        // Copy all masks from original layer to white layer
        var originalMasks = originalLayer.property("ADBE Mask Parade");
        var whiteMasks = whiteLayer.property("ADBE Mask Parade");
        
        if (originalMasks && originalMasks.numProperties > 0) {
            for (var m = 1; m <= originalMasks.numProperties; m++) {
                var originalMask = originalMasks.property(m);
                if (originalMask) {
                    var newMask = whiteMasks.addProperty("ADBE Mask Atom");
                    
                    // Copy mask properties safely
                    try {
                        var maskShape = originalMask.property("ADBE Mask Shape");
                        var maskMode = originalMask.property("ADBE Mask Mode");
                        var maskOpacity = originalMask.property("ADBE Mask Opacity");
                        var maskFeather = originalMask.property("ADBE Mask Feather");
                        
                        if (maskShape) newMask.property("ADBE Mask Shape").setValue(maskShape.value);
                        if (maskMode) newMask.property("ADBE Mask Mode").setValue(maskMode.value);
                        if (maskOpacity) newMask.property("ADBE Mask Opacity").setValue(maskOpacity.value);
                        if (maskFeather) newMask.property("ADBE Mask Feather").setValue(maskFeather.value);
                    } catch (maskError) {
                        $.writeln("DEBUG JSX: Error copying mask " + m + ": " + maskError.toString());
                    }
                }
            }
        }
        
        // Hide the original layer for mask render
        originalLayer.enabled = false;
        
        // Render mask
        var maskItem = renderQueue.items.add(originalComp);
        
        try {
            maskItem.outputModule(1).applyTemplate("H.264 - Match Render Settings - 15 Mbps");
            $.writeln("DEBUG JSX: Using H.264 15 Mbps preset for mask");
        } catch (templateError) {
            try {
                maskItem.outputModule(1).applyTemplate("H.264");
                $.writeln("DEBUG JSX: Using generic H.264 preset for mask");
            } catch (templateError2) {
                maskItem.outputModule(1).format = "H.264";
                $.writeln("DEBUG JSX: Using default H.264 format for mask");
            }
        }
        
        maskItem.outputModule(1).file = maskPath;
        renderQueue.render();
        
        // Wait for render to complete by checking the render queue status
        while (renderQueue.rendering) {
            $.sleep(100); // Wait 100ms before checking again
        }
        $.writeln("DEBUG JSX: Mask render queue finished.");
        
        // Clean up mask render and restore original state
        maskItem.remove();
        
        // Safely remove temporary layers
        try {
            if (whiteLayer) whiteLayer.remove(); // Remove the white foreground layer
        } catch (e) {
            $.writeln("DEBUG JSX: Could not remove white layer: " + e.toString());
        }
        
        try {
            if (blackLayer) blackLayer.remove(); // Remove the black background layer
        } catch (e) {
            $.writeln("DEBUG JSX: Could not remove black layer: " + e.toString());
        }
        
        // Re-enable the original layer and restore mask modes
        if (originalLayer) {
            originalLayer.enabled = true;
            var masks = originalLayer.property("ADBE Mask Parade");
            for (var m = 1; m <= masks.numProperties; m++) {
                masks.property(m).maskMode = maskModes[m-1]; // Restore original mode
            }
        }
        
        $.writeln("DEBUG JSX: Both renders completed");
        
        // Check if files were created
        if (sourcePath.exists) {
            $.writeln("DEBUG JSX: Source file created successfully");
        } else {
            $.writeln("DEBUG JSX: ERROR - Source file was NOT created!");
        }
        
        if (maskPath.exists) {
            $.writeln("DEBUG JSX: Mask file created successfully");
        } else {
            $.writeln("DEBUG JSX: ERROR - Mask file was NOT created!");
        }
        
        app.endUndoGroup();
        
        // Return result as manual JSON string (escape backslashes for JSON compatibility)
        var sourcePathStr = sourcePath.fsName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        var maskPathStr = maskPath.fsName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        var renderFolderStr = renderFolder.fsName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

        var resultJSON = '{"sourceVideoPath":"' + sourcePathStr + '","maskVideoPath":"' + maskPathStr + '","renderFolder":"' + renderFolderStr + '","frameRate":' + selectionInfo.frameRate + '}';
        
        $.writeln("DEBUG JSX: Successfully created JSON. Preparing to return.");
        
        // Add a final delay to ensure After Effects has stabilized before returning
        $.sleep(1000); 
        
        $.writeln("DEBUG JSX: Final delay complete. Returning JSON: " + resultJSON);
        
        return resultJSON;
        
    } catch (error) {
        app.endUndoGroup();
        return "ERROR:" + error.toString();
    }
}

/**
 * Imports a video file into the After Effects project
 */
function importVideoFile(filePath) {
    try {
        app.beginUndoGroup("Import Generative Fill Result");
        
        var file = new File(filePath);
        if (!file.exists) {
            throw new Error("File does not exist: " + filePath);
        }
        
        var importOptions = new ImportOptions(file);
        var importedItem = app.project.importFile(importOptions);
        
        app.endUndoGroup();
        
        return "SUCCESS:Imported " + importedItem.name;
        
    } catch (error) {
        app.endUndoGroup();
        return "ERROR:" + error.toString();
    }
}

/**
 * Helper function to get After Effects version info
 */
function getAEInfo() {
    // Return app info as manual JSON string
    return '{"appName":"' + app.appName + '","version":"' + app.version + '","buildNumber":"' + app.buildNumber + '","language":"' + app.isoLanguage + '}';
}

/**
 * Helper function to read file as base64 for upload
 */
function readFileAsBase64(filePath) {
    try {
        $.writeln("DEBUG: Attempting to read file: " + filePath);
        var file = new File(filePath);
        $.writeln("DEBUG: File object created, exists: " + file.exists);
        
        if (!file.exists) {
            $.writeln("DEBUG: File does not exist at path: " + filePath);
            return "ERROR:File does not exist at path: " + filePath;
        }
        
        file.encoding = "BINARY";
        file.open("r");
        var content = file.read();
        file.close();
        
        // Convert binary content to base64
        var base64 = "";
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        var bytes = [];
        
        for (var i = 0; i < content.length; i++) {
            bytes.push(content.charCodeAt(i));
        }
        
        for (var i = 0; i < bytes.length; i += 3) {
            var b1 = bytes[i];
            var b2 = bytes[i + 1] || 0;
            var b3 = bytes[i + 2] || 0;
            
            var encoded = (b1 << 16) | (b2 << 8) | b3;
            
            base64 += chars[(encoded >> 18) & 63];
            base64 += chars[(encoded >> 12) & 63];
            base64 += i + 1 < bytes.length ? chars[(encoded >> 6) & 63] : "=";
            base64 += i + 2 < bytes.length ? chars[encoded & 63] : "=";
        }
        
        return base64;
        
    } catch (error) {
        return "ERROR:" + error.toString();
    }
}

/**
 * Helper function to save file from URL directly
 */
function saveFileFromUrl(url, filePath) {
    try {
        $.writeln("DEBUG: saveFileFromUrl called for: " + filePath);
        $.writeln("DEBUG: URL: " + url);
        
        // Create the target file
        var targetFile = new File(filePath);
        
        // Create directory if it doesn't exist
        var parentFolder = targetFile.parent;
        if (!parentFolder.exists) {
            parentFolder.create();
        }
        
        // Use system command to download the file directly
        var command;
        if ($.os.indexOf("Windows") !== -1) {
            // Windows command
            command = 'powershell -Command "Invoke-WebRequest -Uri \'' + url + '\' -OutFile \'' + targetFile.fsName + '\'"';
        } else {
            // macOS/Linux command using curl
            command = 'curl -L "' + url + '" -o "' + targetFile.fsName + '"';
        }
        
        $.writeln("DEBUG: Executing command: " + command);
        var result = system.callSystem(command);
        $.writeln("DEBUG: Command result: " + result);
        
        // Check if file was created successfully
        if (targetFile.exists && targetFile.length > 0) {
            $.writeln("DEBUG: File downloaded successfully, size: " + targetFile.length);
            return "SUCCESS:File downloaded to " + targetFile.fsName;
        } else {
            throw new Error("File was not created or is empty");
        }
        
    } catch (error) {
        $.writeln("DEBUG: Error in saveFileFromUrl: " + error.toString());
        return "ERROR:" + error.toString();
    }
}