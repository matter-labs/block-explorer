# put csv near this script and run
# csv should have this fields: allure_id;name;description;precondition;status;scenario;tag
# change output_folder() as you wish

import csv
import re
import os

def remove_extra_chars_from_filename(filename):
    return re.sub(r'[^\w\s.-]', '', filename)

def output_folder():
    return "BE Tests"

def escape_special_chars(text):
    return re.sub(r'([{}<>])', r'\\\1', text)

def format_tags(tags):
    return [tag.strip() for tag in tags.split(',')]

def format_as_list(text):
    if not text:
        return ''
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    return escape_special_chars('\n'.join(f'  - {line}' for line in lines))

def format_scenario(scenario):
    if not scenario:
        return ''
    lines = [line.rstrip() for line in scenario.split('\n') if line.strip()]
    formatted_scenario = ''
    current_indent = 0
    for line in lines:
        indent = 0
        for char in line:
            if char == '\t':
                indent += 1
            elif char == ' ':
                indent += 4
            else:
                break
        if indent > current_indent:
            formatted_scenario += '    ' * (indent - current_indent) + '- ' + line.lstrip('\t ') + '\n'
        elif indent < current_indent:
            formatted_scenario += '    ' * ((current_indent - indent) // 4) + '- ' + line.lstrip('\t ') + '\n'
        else:
            formatted_scenario += '- ' + line.lstrip('\t ') + '\n'
        current_indent = indent
    return escape_special_chars(formatted_scenario)

if not os.path.exists(output_folder()):
    os.makedirs(output_folder())


with open('report.csv', newline='', encoding='utf-8') as csvfile:
    reader = csv.DictReader(csvfile, delimiter=';')

    for row in reader:
        allure_id = row['allure_id']
        name = row['name']
        name_parts = name.split('-', 2) if '-' in name else ('Others', 'Others', name)
        subfolder = name_parts[0]
        root_folder = name_parts[1] if len(name_parts) > 2 else subfolder
        test_name = '-'.join(name_parts[2:]) if len(name_parts) > 3 else name
        filename = f'id{allure_id} - {remove_extra_chars_from_filename(name)}.md'
        if root_folder == '':
            root_folder = subfolder

        root_folder_path = os.path.join(output_folder(), root_folder)
        if not os.path.exists(root_folder_path):
            os.makedirs(root_folder_path)

        subfolder_path = os.path.join(root_folder_path, subfolder)
        if not os.path.exists(subfolder_path):
            os.makedirs(subfolder_path)

        with open(os.path.join(subfolder_path, filename), 'w', encoding='utf-8') as mdfile:
            # tags
            tags = format_tags(row['tag'] + ', ' + row['status'])
            mdfile.write('---\n')
            mdfile.write(f'tags: {tags}\n')
            mdfile.write('---\n\n')
            # name
            mdfile.write(f'# id{allure_id} {name}\n\n')
            # description
            description = row['description']
            mdfile.write('## Description\n')
            mdfile.write(format_as_list(description) + '\n\n')
            # precondition
            precondition = row['precondition']
            mdfile.write('## Precondition\n')
            mdfile.write(format_as_list(precondition) + '\n\n')
            # scenario
            scenario = row['scenario']
            mdfile.write('## Scenario\n')
            mdfile.write(format_scenario(scenario))
