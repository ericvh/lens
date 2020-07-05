import Config from "conf"
import Singleton from "./utils/singleton";
import migrations from "../migrations/cluster-store"
import { Cluster, ClusterBaseInfo } from "../main/cluster";

export class ClusterStore extends Singleton {
  private storeConfig = new Config({
    configName: "lens-cluster-store",
    accessPropertiesByDotNotation: false, // To make dots safe in cluster context names
    migrations: migrations,
  })

  public getAllClusterObjects(): Cluster[] {
    return this.storeConfig.get("clusters", []).map((clusterInfo: ClusterBaseInfo) => {
      return new Cluster(clusterInfo)
    })
  }

  public getAllClusters(): ClusterBaseInfo[] {
    return this.storeConfig.get("clusters", [])
  }

  public removeCluster(id: string): void {
    this.storeConfig.delete(id);
    const clusterBaseInfos = this.getAllClusters()
    const index = clusterBaseInfos.findIndex((cbi) => cbi.id === id)
    if (index !== -1) {
      clusterBaseInfos.splice(index, 1)
      this.storeConfig.set("clusters", clusterBaseInfos)
    }
  }

  public removeClustersByWorkspace(workspace: string) {
    this.getAllClusters().forEach((cluster) => {
      if (cluster.workspace === workspace) {
        this.removeCluster(cluster.id)
      }
    })
  }

  public getCluster(id: string): Cluster {
    const cluster = this.getAllClusterObjects().find((cluster) => cluster.id === id)
    if (cluster) {
      return cluster
    }

    return null
  }

  public saveCluster(cluster: ClusterBaseInfo) {
    const clusters = this.getAllClusters();
    const index = clusters.findIndex((cl) => cl.id === cluster.id)
    const storable = {
      id: cluster.id,
      kubeConfigPath: cluster.kubeConfigPath,
      contextName: cluster.contextName,
      preferences: cluster.preferences,
      workspace: cluster.workspace
    }
    if (index === -1) {
      clusters.push(storable)
    } else {
      clusters[index] = storable
    }
    this.storeConfig.set("clusters", clusters)
  }

  public storeClusters(clusters: ClusterBaseInfo[]) {
    clusters.forEach((cluster: ClusterBaseInfo) => {
      this.removeCluster(cluster.id)
      this.saveCluster(cluster)
    })
  }

  public reloadCluster(cluster: ClusterBaseInfo): void {
    const storedCluster = this.getCluster(cluster.id);
    if (storedCluster) {
      cluster.kubeConfigPath = storedCluster.kubeConfigPath
      cluster.contextName = storedCluster.contextName
      cluster.preferences = storedCluster.preferences
      cluster.workspace = storedCluster.workspace
    }
  }
}

export const clusterStore: ClusterStore = ClusterStore.getInstance();
