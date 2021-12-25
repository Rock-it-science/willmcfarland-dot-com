# Release v0.1 (https://github.com/Rock-it-science/pokemon-guesser/releases/tag/v0.1)

from sklearn import tree
import pandas as pd
import numpy as np

# List of affirmative words
affirm = ['yes', 'true', 'y', '1']

# Create the classification tree
# Load data
df = pd.read_csv('./routes/pokemon-guesser/data/pokemon_preprocessed.csv')

X = df.drop(['name', 'pokedex_number'] , axis=1)
y = df['pokedex_number']

# Fit model classification tree model
clf = tree.DecisionTreeClassifier()
clf.fit(X, y)

tree = clf.tree_
node = 0      #Index of root node
while True:
    feat,thres = tree.feature[node],tree.threshold[node]
    #print(feat,thres)

    # Message
    feature = X.columns[feat]
    message = ""
    if "type1" in feature: message = "Is your pokemon's primary type " + feature.split("type1_")[1][1:] + "?"
    elif "type2" in feature: message = "Is your pokemon's secondary type " + feature.split("type2_")[1][1:] + "?"
    elif "weight_low" in feature: message = "Is your pokemon's weight less than 60kg (132lbs)?"
    elif "weight_high" in feature: message = "Is your pokemon's weight more than 60kg (132lbs)?"
    elif "height_low" in feature: message = "Is your pokemon's height less than 1.2m (4ft)?"
    elif "height_high" in feature: message = "Is your pokemon's height more than 1.2m (4ft)?"
    elif "generation" in feature: message = "Did your pokemon first appear in generation " + feature.split("generation_")[1][1:] + "?"
    elif "legendary" in feature: message = "Is your pokemon a legendary?"
    elif "first_evolution" in feature: message = "Does your pokemon evolve (further)?"
    elif "last_evolution" in feature: message = "Is your pokemon the last evolution of many?"
    elif "attack_low" in feature: message = "Does your pokemon have less than 77 attack points?"
    elif "attack_high" in feature: message = "Does your pokemon have more than 77 attack points?"
    elif "defense_low" in feature: message = "Does your pokemon have less than 73 defense points?"
    elif "defense_high" in feature: message = "Does your pokemon have more than 73 defense points?"
    else: message = feature

    # Print rule
    v = input(message)

    if v.lower() not in affirm:
        node = tree.children_left[node]
    else:
        node = tree.children_right[node]
    if tree.children_left[node] == tree.children_right[node]: #Check for leaf
        label = np.argmax(tree.value[node])
        print(f"Your pokemon is {df.loc[df['pokedex_number'] == label+1]['name'].values[0]}")
        break