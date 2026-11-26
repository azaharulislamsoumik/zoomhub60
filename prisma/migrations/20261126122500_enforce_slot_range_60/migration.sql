ALTER TABLE "ZoomAccount"
DROP CONSTRAINT "ZoomAccount_slotNumber_range_check";

ALTER TABLE "ZoomAccount"
ADD CONSTRAINT "ZoomAccount_slotNumber_range_check"
CHECK ("slotNumber" >= 1 AND "slotNumber" <= 60);