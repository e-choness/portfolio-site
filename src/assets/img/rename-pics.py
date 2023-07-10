import os
import sys

dir_path = "background"
counter = 1

commandLineArgs = sys.argv

if len(commandLineArgs) > 1:
    pattern = commandLineArgs[1] + "_{}"
else:
    print("Enter a new name pattern for the new files.")
    sys.exit()

for filename in os.listdir(dir_path):
    file_ext = os.path.splitext(filename)[1]
    new_filename = pattern.format(counter) + file_ext
    old_filename = os.path.join(dir_path, filename)
    new_filepath = os.path.join(dir_path, new_filename)
    
    os.rename(old_filename, new_filepath)
    
    counter+=1
    print("Renaming: " + filename + "...")
    
print("All files renamed.")