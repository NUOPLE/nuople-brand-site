export declare class UploadController {
    uploadImage(file: Express.Multer.File): {
        url: string;
        filename: string;
        size: number;
    };
}
