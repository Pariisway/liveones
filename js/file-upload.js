// File upload for profile pictures
document.addEventListener("DOMContentLoaded", function() {
    const profilePicInput = document.getElementById("profilePicUrl");
    const uploadButton = document.createElement("button");
    
    if (profilePicInput && profilePicInput.parentNode) {
        // Add upload button next to URL input
        uploadButton.type = "button";
        uploadButton.innerHTML = '<i class="fas fa-upload"></i> Upload Image';
        uploadButton.className = "btn-secondary";
        uploadButton.style.marginLeft = "10px";
        
        profilePicInput.parentNode.appendChild(uploadButton);
        
        // Create file input
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.style.display = "none";
        document.body.appendChild(fileInput);
        
        // Upload button click
        uploadButton.addEventListener("click", function() {
            fileInput.click();
        });
        
        // File selection
        fileInput.addEventListener("change", async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            // Validate file
            if (!file.type.startsWith("image/")) {
                alert("Please select an image file (JPG, PNG, GIF)");
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert("Image must be less than 5MB");
                return;
            }
            
            uploadButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            uploadButton.disabled = true;
            
            try {
                // Upload to Firebase Storage
                const user = firebase.auth().currentUser;
                if (!user) throw new Error("Not logged in");
                
                const storage = firebase.storage();
                const storageRef = storage.ref();
                const filename = `profile_${user.uid}_${Date.now()}.${file.name.split('.').pop()}`;
                const fileRef = storageRef.child(`profile_pictures/${filename}`);
                
                // Upload file
                const snapshot = await fileRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                
                // Update the URL input
                profilePicInput.value = downloadURL;
                
                // Show preview
                const preview = document.getElementById("profileImagePreview");
                if (preview) {
                    preview.src = downloadURL;
                }
                
                alert("Image uploaded successfully!");
                
            } catch (error) {
                console.error("Upload error:", error);
                alert("Upload failed: " + error.message);
            } finally {
                uploadButton.innerHTML = '<i class="fas fa-upload"></i> Upload Image';
                uploadButton.disabled = false;
                fileInput.value = "";
            }
        });
    }
});
