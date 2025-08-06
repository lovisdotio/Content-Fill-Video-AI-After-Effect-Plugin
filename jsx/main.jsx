// Generative Fill Video - ExtendScript for After Effects
// Created by Lovis Odin - This script handles all After Effects operations

/**
 * Validates the current selection in After Effects
 * Returns JSON string with selection info or error
 */
function validateSelectionForInpaint() {
    try {
        app.beginUndoGroup("Validate Selection");
        
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            throw new Error("Please select a composition.");
        }
        
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length !== 1) {
            throw new Error("Please select exactly one layer.");
        }
        
        var layer = selectedLayers[0];
        var maskPropertyGroup = layer.property("ADBE Mask Parade");
        if (!maskPropertyGroup || maskPropertyGroup.numProperties === 0) {
            throw new Error("The selected layer has no masks.");
        }
        
        app.endUndoGroup();
        
        return '{"compName":"' + comp.name + '","layerName":"' + layer.name + '","compId":' + comp.id + ',"layerId":' + layer.id + ',"compWidth":' + comp.width + ',"compHeight":' + comp.height + ',"compDuration":' + comp.duration + ',"frameRate":' + comp.frameRate + '}';
        
    } catch (error) {
        app.endUndoGroup();
        return "ERROR:" + error.toString();
    }
}

/**
 * Validates the current selection for video-to-video mode
 */
function validateSelectionForVideo() {
    try {
        app.beginUndoGroup("Validate Selection for Video");
        
        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            throw new Error("Please select a composition.");
        }
        
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length !== 1) {
            throw new Error("Please select exactly one layer.");
        }
        
        var layer = selectedLayers[0];
        
        app.endUndoGroup();
        
        return '{"compName":"' + comp.name + '","layerName":"' + layer.name + '","compId":' + comp.id + ',"layerId":' + layer.id + ',"compWidth":' + comp.width + ',"compHeight":' + comp.height + ',"compDuration":' + comp.duration + ',"frameRate":' + comp.frameRate + '}';
        
    } catch (error) {
        app.endUndoGroup();
        return "ERROR:" + error.toString();
    }
}

/**
 * Renders only the selected layer for video-to-video
 */
function renderVideoForVideo(selectionInfoString, renderFolderName) {
    try {
        app.beginUndoGroup("Render for Video-to-Video");
        
        var selectionInfo = eval('(' + selectionInfoString + ')');
        var originalComp = findCompById(selectionInfo.compId);
        if (!originalComp) throw new Error("Could not find the original composition.");
        
        var projectFolder = getProjectFolder();
        var renderFolder = new Folder(projectFolder.fsName + "/" + renderFolderName);
        if (!renderFolder.exists) renderFolder.create();
        
        var sourcePath = new File(renderFolder.fsName + "/source_v2v.mp4");
        
        var originalStates = setLayerStates(originalComp, selectionInfo.layerName, true); // Keep only selected layer

        var renderQueue = app.project.renderQueue;
        var sourceItem = renderQueue.items.add(originalComp);
        applyH264Template(sourceItem);
        sourceItem.outputModule(1).file = sourcePath;
        
        renderAndWait(renderQueue);
        sourceItem.remove();
        
        restoreLayerStates(originalComp, originalStates);
        
        app.endUndoGroup();
        
        var sourcePathStr = sourcePath.fsName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        var renderFolderStr = renderFolder.fsName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return '{"sourceVideoPath":"' + sourcePathStr + '","renderFolder":"' + renderFolderStr + '","frameRate":' + selectionInfo.frameRate + '}';
        
    } catch (error) {
        app.endUndoGroup();
        return "ERROR:" + error.toString();
    }
}

/**
 * Renders the source video and the mask video.
 */
function renderVideos(selectionInfoString, renderFolderName) {
    try {
        app.beginUndoGroup("Generative Fill Video Render");

        var selectionInfo = eval('(' + selectionInfoString + ')');
        var originalComp = findCompById(selectionInfo.compId);
        if (!originalComp) throw new Error("Could not find the original composition.");

        var originalLayer = findLayerByName(originalComp, selectionInfo.layerName);
        if (!originalLayer) throw new Error("Could not find the layer: " + selectionInfo.layerName);
        
        var projectFolder = getProjectFolder();
        var renderFolder = new Folder(projectFolder.fsName + "/" + renderFolderName);
        if (!renderFolder.exists) renderFolder.create();
        
        var sourcePath = new File(renderFolder.fsName + "/source.mp4");
        var maskPath = new File(renderFolder.fsName + "/mask.mp4");
        var renderQueue = app.project.renderQueue;

        // --- Render Source Video ---
        var whiteUnderlay = originalComp.layers.addSolid([1, 1, 1], "Temp_White_Underlay", originalComp.width, originalComp.height, 1, originalComp.duration);
        whiteUnderlay.moveAfter(originalLayer);
        var originalMaskModes = setMaskModes(originalLayer, MaskMode.SUBTRACT);
        
        var sourceItem = renderQueue.items.add(originalComp);
        applyH264Template(sourceItem);
        sourceItem.outputModule(1).file = sourcePath;
        renderAndWait(renderQueue);
        sourceItem.remove();
        
        whiteUnderlay.remove();
        restoreMaskModes(originalLayer, originalMaskModes);

        // --- Render Mask Video ---
        // Hide all existing layers first
        var layerStates = [];
        for (var i = 1; i <= originalComp.numLayers; i++) {
            var layer = originalComp.layer(i);
            layerStates.push({index: i, enabled: layer.enabled});
            layer.enabled = false;
        }
        
        // Create black background
        var blackBg = originalComp.layers.addSolid([0, 0, 0], "Temp_Black_BG", originalComp.width, originalComp.height, 1, originalComp.duration);
        
        // Create white foreground with masks copied from original layer
        var whiteFg = originalComp.layers.addSolid([1, 1, 1], "Temp_White_FG", originalComp.width, originalComp.height, 1, originalComp.duration);
        
        // Copy masks from original layer to white solid
        var originalMasks = originalLayer.property("ADBE Mask Parade");
        var whiteMasks = whiteFg.property("ADBE Mask Parade");
        
        for (var m = 1; m <= originalMasks.numProperties; m++) {
            var originalMask = originalMasks.property(m);
            var newMask = whiteMasks.addProperty("ADBE Mask Atom");
            
            try {
                newMask.property("ADBE Mask Shape").setValue(originalMask.property("ADBE Mask Shape").value);
                newMask.property("ADBE Mask Feather").setValue(originalMask.property("ADBE Mask Feather").value);
                newMask.property("ADBE Mask Opacity").setValue(originalMask.property("ADBE Mask Opacity").value);
                newMask.maskMode = MaskMode.ADD;
            } catch (maskError) {
                // Continue with next mask if one fails
            }
        }
        
        // Render mask
        var maskItem = renderQueue.items.add(originalComp);
        applyH264Template(maskItem);
        maskItem.outputModule(1).file = maskPath;
        renderAndWait(renderQueue);
        maskItem.remove();

        // Clean up temporary layers
        whiteFg.remove();
        blackBg.remove();
        
        // Restore original layer states
        for (var i = 0; i < layerStates.length; i++) {
            if (layerStates[i].index <= originalComp.numLayers) {
                originalComp.layer(layerStates[i].index).enabled = layerStates[i].enabled;
            }
        }
        
        app.endUndoGroup();

        var sourcePathStr = sourcePath.fsName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        var maskPathStr = maskPath.fsName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        var renderFolderStr = renderFolder.fsName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        return '{"sourceVideoPath":"' + sourcePathStr + '","maskVideoPath":"' + maskPathStr + '","renderFolder":"' + renderFolderStr + '","frameRate":' + selectionInfo.frameRate + ',"compWidth":' + originalComp.width + ',"compHeight":' + originalComp.height + '}';

    } catch (error) {
        // Ensure cleanup happens on error
        if (app.activeViewer) {
            app.activeViewer.setActive();
        }
        if (app.project.renderQueue.numItems > 0) {
            for (var i = app.project.renderQueue.numItems; i >= 1; i--) {
                app.project.renderQueue.item(i).remove();
            }
        }
        app.endUndoGroup();
        return "ERROR:" + error.toString();
    }
}


/**
 * Imports a video file into the After Effects project
 */
function importVideoFile(filePath, selectionInfoString) {
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
 * Helper function to save file from URL directly using system commands
 */
function saveFileFromUrl(url, filePath) {
    try {
        var targetFile = new File(filePath);
        var parentFolder = targetFile.parent;
        if (!parentFolder.exists) parentFolder.create();
        
        var command;
        if ($.os.indexOf("Windows") !== -1) {
            command = 'powershell -Command "(New-Object System.Net.WebClient).DownloadFile(\'' + url + '\', \'' + targetFile.fsName + '\')"';
        } else {
            command = 'curl -L "' + url + '" -o "' + targetFile.fsName + '"';
        }
        
        system.callSystem(command);
        
        if (targetFile.exists && targetFile.length > 0) {
            return "SUCCESS:File downloaded to " + targetFile.fsName;
        } else {
            throw new Error("File download failed or file is empty.");
        }
    } catch (error) {
        return "ERROR:" + error.toString();
    }
}

// --- UTILITY FUNCTIONS ---

function findCompById(id) {
    for (var i = 1; i <= app.project.numItems; i++) {
        if (app.project.item(i) instanceof CompItem && app.project.item(i).id === id) {
            return app.project.item(i);
        }
    }
    return null;
}

function findLayerByName(comp, name) {
    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).name === name) {
            return comp.layer(i);
        }
    }
    return null;
}

function getProjectFolder() {
    if (app.project.file && app.project.file.path !== "") {
        return app.project.file.parent;
    }
    alert("Please save your project first before running the script.");
    throw new Error("Project not saved.");
}


function applyH264Template(renderItem) {
    try {
        renderItem.outputModule(1).applyTemplate("H.264 - Match Render Settings - 15 Mbps");
    } catch (e) {
        try {
            renderItem.outputModule(1).applyTemplate("H.264");
        } catch (e2) {
            renderItem.outputModule(1).format = "H.264";
        }
    }
}

function renderAndWait(renderQueue) {
    renderQueue.render();
    while (renderQueue.rendering) {
        $.sleep(200);
    }
}

function setMaskModes(layer, mode) {
    var originalModes = [];
    var masks = layer.property("ADBE Mask Parade");
    for (var i = 1; i <= masks.numProperties; i++) {
        originalModes.push(masks.property(i).maskMode);
        masks.property(i).maskMode = mode;
    }
    return originalModes;
}

function restoreMaskModes(layer, modes) {
    var masks = layer.property("ADBE Mask Parade");
    for (var i = 0; i < modes.length; i++) {
        masks.property(i + 1).maskMode = modes[i];
    }
}

function getAEInfo() {
    return '{"appName":"' + app.appName + '","version":"' + app.version + '","buildNumber":"' + app.buildNumber + '","language":"' + app.isoLanguage + '}';
}
