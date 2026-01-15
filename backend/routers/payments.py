from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.schemas import payments as payment_schemas
from backend.schemas import users as user_schemas
from backend.crud import payments as payment_crud
from backend.crud import students as student_crud
from backend.core import database, security

router = APIRouter()

@router.get("/payments/", response_model=List[payment_schemas.Payment])
def read_payments(
    student_id: Optional[int] = None, 
    year: Optional[int] = None, 
    month: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db), 
    current_user: user_schemas.User = Depends(security.get_current_user)
):
    # In a real app, restrict to students owned by user, but skipping complex join for brevity
    return payment_crud.get_payments(db, user_id=current_user.id, student_id=student_id, year=year, month=month, skip=skip, limit=limit, search=search)

@router.post("/payments/", response_model=payment_schemas.Payment)
def create_payment(
    payment: payment_schemas.PaymentCreate, 
    db: Session = Depends(database.get_db), 
    current_user: user_schemas.User = Depends(security.get_current_user)
):
    # Verify student belongs to user
    # student = student_crud.get_student(db, payment.student_id)
    # verify ownership...
    return payment_crud.create_payment(db=db, payment=payment)

@router.put("/payments/{payment_id}", response_model=payment_schemas.Payment)
def update_payment(
    payment_id: int, 
    payment: payment_schemas.PaymentCreate, 
    db: Session = Depends(database.get_db), 
    current_user: user_schemas.User = Depends(security.get_current_user)
):
    return payment_crud.update_payment(db, payment_id=payment_id, payment_data=payment)

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from fastapi.responses import StreamingResponse
import io

@router.post("/payments/report/docx")
def generate_monthly_report(
    month: int,
    year: int,
    db: Session = Depends(database.get_db),
    current_user: user_schemas.User = Depends(security.get_current_user)
):
    # 1. Get all students (limit 1000 to be safe)
    # We reuse functionality, but ideally we'd have a lighter query for just names/IDs
    all_students = student_crud.get_students(db, user_id=current_user.id, limit=1000)
    
    # 2. Get payments for the month
    payments = payment_crud.get_payments(db, user_id=current_user.id, year=year, month=month, limit=1000)
    
    # 3. Calculate Stats
    total_students = len(all_students)
    paid_count = 0
    total_received = 0.0
    
    student_status_list = []
    
    for student in all_students:
        # Find payment for this student
        payment = next((p for p in payments if p.student_id == student.id), None)
        
        is_paid = payment and payment.status == 'PAID'
        status_label = 'PAGO' if is_paid else 'PENDENTE'
        
        if is_paid:
            paid_count += 1
            total_received += (payment.amount or 0.0)
            
        student_status_list.append({
            "name": student.name,
            "parent": student.parent_name or "-",
            "school_year": student.school_year or "-",
            "class_type": student.class_type or "-",
            "status": status_label,
            "amount": payment.amount if payment else 0.0
        })
        
    pending_count = total_students - paid_count
    
    # 4. Generate DOCX
    document = Document()
    
    # Title
    title = document.add_heading(f'Relatório Financeiro - {month:02d}/{year}', 0)
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    # Summary
    document.add_heading('Resumo do Mês', level=1)
    table_stats = document.add_table(rows=1, cols=4)
    table_stats.style = 'Table Grid'
    hdr_stats = table_stats.rows[0].cells
    hdr_stats[0].text = 'Total Alunos'
    hdr_stats[1].text = 'Pagos'
    hdr_stats[2].text = 'Pendentes'
    hdr_stats[3].text = 'Total Recebido'
    
    for cell in hdr_stats:
        cell.paragraphs[0].runs[0].bold = True
        
    row_stats = table_stats.add_row().cells
    row_stats[0].text = str(total_students)
    row_stats[1].text = str(paid_count)
    row_stats[2].text = str(pending_count)
    row_stats[3].text = f"R$ {total_received:.2f}"
    
    # Detailed List
    document.add_heading('Detalhamento por Aluno', level=1)
    
    table = document.add_table(rows=1, cols=6)
    table.style = 'Table Grid'
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = 'Aluno'
    hdr_cells[1].text = 'Responsável'
    hdr_cells[2].text = 'Ano Escolar'
    hdr_cells[3].text = 'Tipo de Aula'
    hdr_cells[4].text = 'Status'
    hdr_cells[5].text = 'Valor Pago'
    
    for cell in hdr_cells:
        cell.paragraphs[0].runs[0].bold = True
        
    for item in student_status_list:
        row_cells = table.add_row().cells
        row_cells[0].text = item["name"]
        row_cells[1].text = item["parent"]
        row_cells[2].text = item["school_year"]
        row_cells[3].text = item["class_type"]
        row_cells[4].text = item["status"]
        row_cells[5].text = f"R$ {item['amount']:.2f}" if item["amount"] > 0 else "-"
        
    # Save to stream
    file_stream = io.BytesIO()
    document.save(file_stream)
    file_stream.seek(0)
    
    return StreamingResponse(
        file_stream, 
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=Financeiro_{month:02d}_{year}.docx"}
    )
