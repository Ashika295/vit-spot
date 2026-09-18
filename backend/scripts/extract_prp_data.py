from html.parser import HTMLParser
import json, os
from collections import Counter

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables = []
        self.current_table = []
        self.current_row = []
        self.current_cell = []
        self.in_cell = False

    def handle_starttag(self, tag, attrs):
        if tag == 'table': self.current_table = []
        elif tag == 'tr': self.current_row = []
        elif tag in ('td', 'th'): self.current_cell = []; self.in_cell = True

    def handle_endtag(self, tag):
        if tag == 'table':
            if self.current_table: self.tables.append(self.current_table)
        elif tag == 'tr':
            if self.current_row: self.current_table.append(self.current_row)
        elif tag in ('td', 'th'):
            self.in_cell = False
            self.current_row.append(' '.join(''.join(self.current_cell).split()))

    def handle_data(self, data):
        if self.in_cell: self.current_cell.append(data)

def extract_prp_rooms():
    scraped_file = r'C:\Users\DELL\.gemini\antigravity-ide\brain\959b018a-7e03-495b-b946-4e3c7e988960\.system_generated\steps\473\content.md'
    with open(scraped_file, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()

    parser = TableParser()
    parser.feed(html)

    student_rooms = []
    teacher_cabins = []
    utility_rooms = []

    for table_idx in range(1, 9):
        floor = table_idx - 1
        table = parser.tables[table_idx]
        
        current_parent_type = ''
        current_parent_school = ''

        for row in table[1:]:
            if len(row) < 2:
                continue
            
            raw_bldg = row[0].strip() if len(row) > 0 else 'PRP Block-1'
            rno = row[1].strip().replace('\ufffd', '').strip()
            school = row[2].strip().replace('\ufffd', '').strip() if len(row) > 2 else ''
            rtype = row[3].strip().replace('\ufffd', '').strip() if len(row) > 3 else ''
            area_sqft_str = row[6].strip() if len(row) > 6 else ''

            if not rno:
                continue

            # If rtype is present and not empty, update current_parent_type
            if rtype:
                current_parent_type = rtype
            elif '-' in rno:
                rtype = current_parent_type or 'Faculty Cabin'
            else:
                rtype = current_parent_type or 'Room'

            if school:
                current_parent_school = school
            else:
                school = current_parent_school or 'PRP'

            low_type = rtype.lower()
            low_rno = rno.lower()

            # Filter out washrooms / electrical rooms
            if any(w in low_type for w in ['toilet', 'electrical room']):
                utility_rooms.append({'room_no': rno, 'floor': floor, 'type': rtype})
                continue

            # Check if faculty cabin or administrative non-student space
            is_faculty_cabin = (
                'faculty cabin' in low_type or
                'cabin' in low_type or
                'staff room' in low_type or
                'dean room' in low_type or
                'office' in low_type or
                'counselling' in low_type or
                'resting room' in low_type or
                'conference room' in low_type or
                'utility room' in low_type or
                'server room' in low_type or
                ('cabin' in current_parent_type.lower()) or
                ('-' in rno and not 'lab' in low_type and not 'class' in low_type)
            )

            norm_rno = rno.upper().replace(' ', '')
            if not norm_rno.startswith('PRP'):
                room_id = f'PRP{norm_rno}'
            else:
                room_id = norm_rno

            if is_faculty_cabin:
                std_type = 'FACULTY_CABIN'
                student_accessible = False
            elif 'lab' in low_type:
                std_type = 'LAB'
                student_accessible = True
            elif 'examination' in low_type or 'online education' in low_type:
                std_type = 'EXAM_HALL'
                student_accessible = True
            elif 'smart' in low_type:
                std_type = 'SMART_CLASSROOM'
                student_accessible = True
            elif 'class' in low_type:
                std_type = 'THEORY'
                student_accessible = True
            elif 'cafeteria' in low_type:
                std_type = 'CAFETERIA'
                student_accessible = True
            elif 'auditorium' in low_type or 'gallery' in low_type:
                std_type = 'AUDITORIUM'
                student_accessible = False
            else:
                std_type = 'THEORY'
                student_accessible = True

            capacity = None
            try:
                area_val = float(area_sqft_str.replace(',', ''))
                if std_type in ['THEORY', 'SMART_CLASSROOM']:
                    capacity = max(30, int(area_val / 14))
                elif std_type == 'LAB':
                    capacity = max(20, int(area_val / 25))
                elif std_type == 'EXAM_HALL':
                    capacity = max(40, int(area_val / 18))
            except:
                capacity = None

            item = {
                'room_id': room_id,
                'room_number': rno,
                'building': 'PRP',
                'block': raw_bldg,
                'floor': floor,
                'room_type': std_type,
                'raw_type': rtype,
                'school': school,
                'student_accessible': student_accessible,
                'capacity': capacity,
                'source': 'OFFICIAL_VIT_WEBSITE'
            }

            if is_faculty_cabin:
                teacher_cabins.append(item)
            else:
                student_rooms.append(item)

        # Also add Ground Floor Auditorium / Gallery if needed
        # Gallery is on Ground Floor (Table 0)

    out_path = r'c:\Users\DELL\Desktop\VIT-SPOT\backend\data\official_prp_rooms.json'
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump({'student_rooms': student_rooms, 'teacher_cabins': teacher_cabins}, f, indent=2)

    print('=== Summary ===')
    print(f'Student Accessible Rooms: {len(student_rooms)}')
    print(f'Teacher Cabins & Offices: {len(teacher_cabins)}')
    print(f'Utility / Washrooms Excluded: {len(utility_rooms)}')

    for f in range(8):
        f_s = [r for r in student_rooms if r['floor'] == f]
        f_c = [r for r in teacher_cabins if r['floor'] == f]
        types_dict = dict(Counter(r['room_type'] for r in f_s))
        print(f'Floor {f}: {len(f_s):2d} student rooms {types_dict} | {len(f_c):2d} teacher cabins')

if __name__ == '__main__':
    extract_prp_rooms()
