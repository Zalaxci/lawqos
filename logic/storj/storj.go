package storj

import (
	"context"
	"os"

	"github.com/joho/godotenv"
	"storj.io/uplink"
)

type StorjWrapper struct {
	ctx        context.Context
	project    *uplink.Project
	bucketName string
}

func (storj StorjWrapper) DownloadReader(fileName string) *uplink.Download {
	storjReader, err := storj.project.DownloadObject(storj.ctx, storj.bucketName, fileName, nil)
	if err != nil {
		panic(err)
	}
	return storjReader
}
func (storj StorjWrapper) DownloadFile(fileName, folderPath string) {
	file, fileErr := os.Create(folderPath + "/" + fileName)
	if fileErr != nil {
		panic(fileErr)
	}
	storjReader := storj.DownloadReader(fileName)
	file.ReadFrom(storjReader)
}
func OpenProject(bucketName string) StorjWrapper {
	envErr := godotenv.Load()
	if envErr != nil {
		panic("Error loading .env file: " + envErr.Error())
	}
	accessGrant := os.Getenv("STORJ_ACCESS_GRANT")
	ctx := context.Background()
	access, accessErr := uplink.ParseAccess(accessGrant)
	if accessErr != nil {
		panic(accessErr)
	}
	project, projectErr := uplink.OpenProject(ctx, access)
	if projectErr != nil {
		panic(projectErr)
	}
	return StorjWrapper{
		ctx,
		project,
		bucketName,
	}
}
