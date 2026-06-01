-- AlterTable
ALTER TABLE "StockQuote" ADD COLUMN     "priceAvg200" DECIMAL(65,30),
ADD COLUMN     "priceAvg50" DECIMAL(65,30),
ADD COLUMN     "week52High" DECIMAL(65,30),
ADD COLUMN     "week52Low" DECIMAL(65,30);
