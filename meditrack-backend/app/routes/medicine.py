"""
Medicine Routes
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, date, timedelta
from uuid import uuid4

from app.routes.auth import get_current_user
from app.database import medicine_db, medicine_log_db, prescription_db
from app.schemas.medicine_schema import (
    MedicineCreate,
    MedicineResponse,
    MedicineListResponse,
    MedicineUpdate,
    MedicineLogResponse,
    MarkTakenRequest,
    MarkMissedRequest,
    AdherenceStatsResponse,
    TodayScheduleResponse,
    MedicineScheduleItem,
    MedicineStatusEnum
)

router = APIRouter()


@router.get("", response_model=MedicineListResponse)
async def get_medicines(
    active_only: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all medicines for the current user
    """
    # Get all prescriptions for user
    prescriptions = await prescription_db.get_by_user_id(current_user["id"])
    prescription_ids = [p["id"] for p in prescriptions]
    
    all_medicines = []
    for prescription_id in prescription_ids:
        medicines = await medicine_db.get_by_prescription_id(prescription_id)
        all_medicines.extend(medicines)
    
    # Filter active medicines if requested
    today = date.today()
    if active_only:
        all_medicines = [
            m for m in all_medicines
            if not m.get("end_date") or 
            datetime.fromisoformat(m["end_date"]).date() >= today
        ]
    
    # Calculate is_active and days_remaining
    formatted_medicines = []
    active_count = 0
    for m in all_medicines:
        end_date = m.get("end_date")
        is_active = True
        days_remaining = None
        
        if end_date:
            end_date_obj = datetime.fromisoformat(end_date).date() if isinstance(end_date, str) else end_date
            is_active = end_date_obj >= today
            days_remaining = max(0, (end_date_obj - today).days) if is_active else 0
        
        if is_active:
            active_count += 1
        
        formatted_medicines.append({
            **m,
            "is_active": is_active,
            "days_remaining": days_remaining
        })
    
    return MedicineListResponse(
        medicines=formatted_medicines,
        total=len(all_medicines),
        active_count=active_count
    )


@router.get("/schedule/today", response_model=TodayScheduleResponse)
async def get_today_schedule(current_user: dict = Depends(get_current_user)):
    """
    Get today's medicine schedule
    """
    # Get all active medicines
    medicines_response = await get_medicines(active_only=True, current_user=current_user)
    
    schedule = []
    today = date.today()
    now = datetime.now()
    
    # Default timing hours
    timing_hours = {
        "morning": 8,
        "afternoon": 13,
        "evening": 18,
        "night": 21,
        "before_breakfast": 7,
        "after_breakfast": 9,
        "before_lunch": 12,
        "after_lunch": 14,
        "before_dinner": 19,
        "after_dinner": 21
    }
    
    for medicine in medicines_response.medicines:
        timings = medicine.get("timing") or ["morning"]
        
        for timing in timings:
            hour = timing_hours.get(timing.lower(), 8)
            scheduled_time = datetime.combine(today, datetime.min.time().replace(hour=hour))
            
            # Check if this dose was already taken
            logs = await medicine_log_db.get_by_medicine_id(medicine["id"])
            today_logs = [
                l for l in logs 
                if datetime.fromisoformat(l["scheduled_time"]).date() == today
                and l.get("timing") == timing
            ]
            
            status = None
            if today_logs:
                status = today_logs[0].get("status")
            
            is_overdue = scheduled_time < now and status is None
            
            schedule.append(MedicineScheduleItem(
                medicine_id=medicine["id"],
                medicine_name=medicine["name"],
                dosage=medicine.get("dosage"),
                scheduled_time=scheduled_time,
                timing=timing,
                status=status,
                is_overdue=is_overdue
            ))
    
    # Sort by scheduled time
    schedule.sort(key=lambda x: x.scheduled_time)
    
    completed = len([s for s in schedule if s.status == MedicineStatusEnum.TAKEN])
    
    return TodayScheduleResponse(
        date=today,
        schedule=schedule,
        total_medicines=len(schedule),
        completed=completed,
        pending=len(schedule) - completed
    )


@router.get("/{medicine_id}", response_model=MedicineResponse)
async def get_medicine(
    medicine_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific medicine by ID
    """
    medicine = await medicine_db.get_by_id(medicine_id)
    
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    # Verify ownership through prescription
    prescription = await prescription_db.get_by_id(medicine["prescription_id"])
    if not prescription or prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this medicine"
        )
    
    # Calculate is_active and days_remaining
    today = date.today()
    end_date = medicine.get("end_date")
    is_active = True
    days_remaining = None
    
    if end_date:
        end_date_obj = datetime.fromisoformat(end_date).date() if isinstance(end_date, str) else end_date
        is_active = end_date_obj >= today
        days_remaining = max(0, (end_date_obj - today).days) if is_active else 0
    
    return {
        **medicine,
        "is_active": is_active,
        "days_remaining": days_remaining
    }


@router.post("/{medicine_id}/mark-taken", response_model=MedicineLogResponse)
async def mark_medicine_taken(
    medicine_id: str,
    request: MarkTakenRequest = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a medicine dose as taken
    """
    medicine = await medicine_db.get_by_id(medicine_id)
    
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    # Verify ownership
    prescription = await prescription_db.get_by_id(medicine["prescription_id"])
    if not prescription or prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this medicine"
        )
    
    taken_at = request.taken_at if request and request.taken_at else datetime.utcnow()
    
    # Create medicine log
    log_id = str(uuid4())
    log_data = {
        "id": log_id,
        "medicine_id": medicine_id,
        "scheduled_time": taken_at.isoformat(),
        "taken_at": taken_at.isoformat(),
        "status": "taken",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await medicine_log_db.create(log_data)
    
    return MedicineLogResponse(
        id=log_id,
        medicine_id=medicine_id,
        scheduled_time=taken_at,
        status=MedicineStatusEnum.TAKEN,
        taken_at=taken_at,
        created_at=datetime.utcnow(),
        medicine_name=medicine["name"]
    )


@router.post("/{medicine_id}/mark-missed", response_model=MedicineLogResponse)
async def mark_medicine_missed(
    medicine_id: str,
    request: MarkMissedRequest = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark a medicine dose as missed
    """
    medicine = await medicine_db.get_by_id(medicine_id)
    
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    # Verify ownership
    prescription = await prescription_db.get_by_id(medicine["prescription_id"])
    if not prescription or prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this medicine"
        )
    
    # Create medicine log
    log_id = str(uuid4())
    log_data = {
        "id": log_id,
        "medicine_id": medicine_id,
        "scheduled_time": datetime.utcnow().isoformat(),
        "taken_at": None,
        "status": "missed",
        "created_at": datetime.utcnow().isoformat()
    }
    
    await medicine_log_db.create(log_data)
    
    return MedicineLogResponse(
        id=log_id,
        medicine_id=medicine_id,
        scheduled_time=datetime.utcnow(),
        status=MedicineStatusEnum.MISSED,
        taken_at=None,
        created_at=datetime.utcnow(),
        medicine_name=medicine["name"]
    )


@router.get("/adherence-stats", response_model=AdherenceStatsResponse)
async def get_adherence_stats(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """
    Get medicine adherence statistics
    """
    # Get all medicines for user
    medicines_response = await get_medicines(active_only=False, current_user=current_user)
    medicine_ids = [m.id for m in medicines_response.medicines]
    
    # Get all logs for these medicines
    all_logs = []
    for medicine_id in medicine_ids:
        logs = await medicine_log_db.get_by_medicine_id(str(medicine_id))
        all_logs.extend(logs)
    
    # Filter logs by date range
    period_start = date.today() - timedelta(days=days)
    period_end = date.today()
    
    filtered_logs = [
        l for l in all_logs
        if datetime.fromisoformat(l["created_at"]).date() >= period_start
    ]
    
    # Calculate statistics
    total_doses = len(filtered_logs)
    taken_doses = len([l for l in filtered_logs if l["status"] == "taken"])
    missed_doses = len([l for l in filtered_logs if l["status"] == "missed"])
    skipped_doses = len([l for l in filtered_logs if l["status"] == "skipped"])
    
    adherence_percentage = (taken_doses / total_doses * 100) if total_doses > 0 else 100.0
    
    # Calculate streaks
    current_streak = 0
    best_streak = 0
    temp_streak = 0
    
    # Sort logs by date
    sorted_logs = sorted(filtered_logs, key=lambda x: x["created_at"])
    
    for log in sorted_logs:
        if log["status"] == "taken":
            temp_streak += 1
            best_streak = max(best_streak, temp_streak)
        else:
            temp_streak = 0
    
    current_streak = temp_streak
    
    return AdherenceStatsResponse(
        total_doses=total_doses,
        taken_doses=taken_doses,
        missed_doses=missed_doses,
        skipped_doses=skipped_doses,
        adherence_percentage=round(adherence_percentage, 1),
        current_streak=current_streak,
        best_streak=best_streak,
        period_start=period_start,
        period_end=period_end
    )


@router.put("/{medicine_id}", response_model=MedicineResponse)
async def update_medicine(
    medicine_id: str,
    update_data: MedicineUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a medicine
    """
    medicine = await medicine_db.get_by_id(medicine_id)
    
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    # Verify ownership
    prescription = await prescription_db.get_by_id(medicine["prescription_id"])
    if not prescription or prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this medicine"
        )
    
    # Update medicine
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # Convert dates to strings for storage
    if "start_date" in update_dict and update_dict["start_date"]:
        update_dict["start_date"] = update_dict["start_date"].isoformat()
    if "end_date" in update_dict and update_dict["end_date"]:
        update_dict["end_date"] = update_dict["end_date"].isoformat()
    
    if update_dict:
        updated = await medicine_db.update(medicine_id, update_dict)
        if updated:
            medicine.update(update_dict)
    
    return medicine


@router.delete("/{medicine_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medicine(
    medicine_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a medicine
    """
    medicine = await medicine_db.get_by_id(medicine_id)
    
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    # Verify ownership
    prescription = await prescription_db.get_by_id(medicine["prescription_id"])
    if not prescription or prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this medicine"
        )
    
    # Delete associated logs
    logs = await medicine_log_db.get_by_medicine_id(medicine_id)
    for log in logs:
        await medicine_log_db.delete(log["id"])
    
    # Delete medicine
    await medicine_db.delete(medicine_id)


@router.get("/{medicine_id}/logs", response_model=List[MedicineLogResponse])
async def get_medicine_logs(
    medicine_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get all logs for a specific medicine
    """
    medicine = await medicine_db.get_by_id(medicine_id)
    
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Medicine not found"
        )
    
    # Verify ownership
    prescription = await prescription_db.get_by_id(medicine["prescription_id"])
    if not prescription or prescription["user_id"] != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this medicine"
        )
    
    logs = await medicine_log_db.get_by_medicine_id(medicine_id)
    
    # Format logs
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            **log,
            "medicine_name": medicine["name"]
        })
    
    return formatted_logs
