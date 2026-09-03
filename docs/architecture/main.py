n = [1,2,2,3,4,4,5,1]
new_list = []
for i in n:
    if i not in new_list:
        new_list.append(i)
print(new_list)
