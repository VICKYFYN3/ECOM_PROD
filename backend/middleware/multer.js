import multer from "multer";

const storage = multer.diskStorage({
    filename:function (req, file, callback) { 
        callback(null, file.originalname);
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
})

export default upload;